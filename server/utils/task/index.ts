import PQueue from "p-queue";
import { db } from "~~/server/utils/db";
import { tNews } from "~~/drizzle/schema/news";
import { crawlCLSNews } from "~~/server/utils/data-source/arktools/cls-news";
import { EventEmitter } from "events";
import { createNewsKeywordTaskUnit } from "./task/news/keyword";
import { createStockKeywordTaskUnit } from "./task/stock/keyword";
import { stockDbHelper } from "./task/stock/utils/db-helper";

const CrawlQueue = new PQueue({ concurrency: 1, intervalCap: 5, interval: 1000 * 60 });
const ZhiPuAIQueue = new PQueue({ concurrency: 1, interval: 1000 * 30, intervalCap: 1 });
const CFAIQueue = new PQueue({ concurrency: 2, interval: 1000, intervalCap: 1 });

interface MyEvents {
    "stock/ai/keyword": [];
    "crawl/news": [];
    "crawl/stock/info/all": [];
    "crawl/stock/price/all": [];
}

export const TaskEmitter = new EventEmitter<MyEvents>();

TaskEmitter.on("crawl/stock/info/all", async () => {
    CrawlQueue.add(async () => {
        const res = await crawlStockInfoSH();
        await stockDbHelper.saveStock(res);
    });
    CrawlQueue.add(async () => {
        const res = await crawlStockInfoSZ();
        await stockDbHelper.saveStock(res);
    });
    CrawlQueue.add(async () => {
        const res = await crawlStockInfoBJ();
        await stockDbHelper.saveStock(res);
    });
});

TaskEmitter.on("crawl/stock/price/all", async () => {
    CrawlQueue.add(async () => {
        try {
            console.log("更新股票实时价格");
            const res = await crawlStockRealTimePrice();
            await stockDbHelper.saveStockDynamicData(res);
        } catch (error) {
            console.error("更新股票实时价格失败");
            console.error(error);
        }
    });
});

const stockKeywordTaskUnit = createStockKeywordTaskUnit();
Promise.resolve().then(async () => {
    while (true) {
        try {
            await ZhiPuAIQueue.onSizeLessThan(10);
            ZhiPuAIQueue.add(() => stockKeywordTaskUnit.consume());
        } catch (error) {
            console.error(error);
        }
    }
});
TaskEmitter.on("stock/ai/keyword", async () => {
    stockKeywordTaskUnit.produce(20);
});

const newsKeywordTaskUnit = createNewsKeywordTaskUnit();
Promise.resolve().then(async () => {
    while (true) {
        try {
            await CFAIQueue.onSizeLessThan(10);
            CFAIQueue.add(() => newsKeywordTaskUnit.consume());
        } catch (error) {
            console.error(error);
        }
    }
});
TaskEmitter.on("crawl/news", async () => {
    const list = await crawlCLSNews();
    await db.insert(tNews).values(list).onConflictDoNothing();
    await newsKeywordTaskUnit.produce();
});
