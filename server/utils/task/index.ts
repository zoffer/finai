import PQueue from "p-queue";
import { EventEmitter } from "events";
import { getStockKeywordTask } from "./keyword/stock";
import { NewsTask } from "./task/news/index";
import { stockDbHelper } from "./task/stock/db-helper";
import { PromiseTool } from "~~/server/utils/promise-tool";

const CrawlQueue = new PQueue({ concurrency: 1, intervalCap: 5, interval: 1000 * 60 });

const AIQueue = new PQueue({ concurrency: 1, interval: 1000 * 30, intervalCap: 1 });

AIQueue.on("active", () => {
    console.log(`[${new Date().toISOString()}]: Size: ${AIQueue.size}  Pending: ${AIQueue.pending}`);
});

const TaskInQueue = new Set<string>();

async function addTaskToQueue(id: string, ...args: Parameters<PQueue["add"]>) {
    if (TaskInQueue.has(id)) {
        return;
    }
    try {
        TaskInQueue.add(id);
        await AIQueue.add(...args);
    } catch (error) {
        console.error(error);
    } finally {
        TaskInQueue.delete(id);
    }
}

interface MyEvents {
    "stock/ai/keyword": [number];
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

TaskEmitter.on("stock/ai/keyword", async (num) => {
    const tasks = await getStockKeywordTask(num);
    for (const [id, task] of tasks) {
        addTaskToQueue(`stock:keyword:${id}`, task);
        if (AIQueue.size >= 100) {
            break;
        }
    }
});

const newsTask = new NewsTask();
TaskEmitter.on("crawl/news", async () => {
    await newsTask.produce();
});
Promise.resolve().then(async () => {
    while (true) {
        try {
            await AIQueue.onSizeLessThan(10);
            AIQueue.add(() => newsTask.consumeKeyword());
        } catch (error) {
            console.error(error);
        }
    }
});
