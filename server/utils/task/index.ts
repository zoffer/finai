import PQueue from "p-queue";
import { EventEmitter } from "events";
import { getStockKeywordTask } from "./keyword/stock";
import NewsTask from "./task/news/index";

const newsTask = new NewsTask();

const TaskQueue = Object.freeze({
    ai: new PQueue({ concurrency: 1, interval: 1000 * 30, intervalCap: 1 }),
});

TaskQueue.ai.on("active", () => {
    console.log(`[${new Date().toISOString()}]: Size: ${TaskQueue.ai.size}  Pending: ${TaskQueue.ai.pending}`);
});

const TaskInQueue = new Set<string>();

async function addTaskToQueue(id: string, ...args: Parameters<PQueue["add"]>) {
    if (TaskInQueue.has(id)) {
        return;
    }
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
    "stock/ai/keyword": [number];
    "crawl:news": [];
}

export const TaskEmitter = new EventEmitter<MyEvents>();

TaskEmitter.on("stock/ai/keyword", async (num) => {
    const tasks = await getStockKeywordTask(num);
    for (const [id, task] of tasks) {
        addTaskToQueue(`stock:keyword:${id}`, task);
        if (TaskQueue.ai.size >= 100) {
            break;
        }
    }
});

TaskEmitter.on("crawl:news", async () => {
    await newsTask.produce();
});
