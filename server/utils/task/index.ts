import PQueue from 'p-queue';
import { EventEmitter } from 'events';
import { getStockKeywordTask } from './keyword/stock';
import { getNewsKeywordTask } from './keyword/news';

const TaskQueue = Object.freeze({
    ai: new PQueue({ concurrency: 1, interval: 1000 * 10, intervalCap: 1 })
})

const TaskInQueue = new Set<string>();

async function addTaskToQueue(id: string, ...args: Parameters<PQueue['add']>) {
    if (TaskInQueue.has(id)) { return; }
    try {
        TaskInQueue.add(id);
        await TaskQueue.ai.add(...args);
    } catch (error) {
        console.error(error);
    } finally {
        TaskInQueue.delete(id);
    }
}

interface MyEvents {
    "stock:keyword": [];
    "news:keyword": [];
}

export const TaskEmitter = new EventEmitter<MyEvents>();

TaskEmitter.on("stock:keyword", async () => {
    const tasks = await getStockKeywordTask(20);
    for (const [id, task] of tasks) {
        addTaskToQueue(`stock:keyword:${id}`, task);
        if (TaskQueue.ai.size >= 100) { break; }
    }
})

TaskEmitter.on("news:keyword", async () => {
    const tasks = await getNewsKeywordTask(20);
    for (const [id, task] of tasks) {
        addTaskToQueue(`news:keyword:${id}`, task, { priority: 1 });
        if (TaskQueue.ai.size >= 100) { break; }
    }
})