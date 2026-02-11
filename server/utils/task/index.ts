import PQueue from "p-queue";
import { db } from "~~/server/utils/db";
import { tNews } from "~~/drizzle/schema/news";
import { crawlCLSNews } from "~~/server/utils/data-source/aktools/cls-news";
import { EventEmitter } from "events";
import { createNewsKeywordTaskUnit } from "./task/news/keyword";
import { createStockKeywordTaskUnit } from "./task/stock/keyword";
import { createNewsEmbeddingTaskUnit } from "./task/news/embedding";
import { stockDbHelper } from "./task/stock/utils/db-helper";

const CrawlQueue = new PQueue({ concurrency: 1, intervalCap: 5, interval: 1000 * 60 });

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
stockKeywordTaskUnit.loop.start();
TaskEmitter.on("stock/ai/keyword", async () => {
    stockKeywordTaskUnit.produce(20);
});

const newsKeywordTaskUnit = createNewsKeywordTaskUnit();
const newsEmbeddingTaskUnit = createNewsEmbeddingTaskUnit();
newsKeywordTaskUnit.loop.start();
newsEmbeddingTaskUnit.loop.start();
TaskEmitter.on("crawl/news", async () => {
    const list = await crawlCLSNews();
    await db.insert(tNews).values(list).onConflictDoNothing();
    await Promise.all([newsKeywordTaskUnit.produce(20), newsEmbeddingTaskUnit.produce(100)]);
});
