import PQueue from 'p-queue';
import { EventEmitter } from 'events';
import getStockKeywordTask from './keyword/stock';
import getNewsKeywordTask from './keyword/news';

export const TaskQueue = Object.freeze({
    ai: new PQueue({ concurrency: 1, interval: 1000 * 10, intervalCap: 1 })
})

interface MyEvents {
    "stock:keyword": [];
    "news:keyword": [];
}

export const TaskEmitter = new EventEmitter<MyEvents>();

TaskEmitter.on("stock:keyword", async () => {
    const tasks = await getStockKeywordTask(100);
    TaskQueue.ai.addAll(tasks).catch(console.error);
})

TaskEmitter.on("news:keyword", async () => {
    const tasks = await getNewsKeywordTask(10);
    TaskQueue.ai.addAll(tasks, { priority: 1 }).catch(console.error);
})