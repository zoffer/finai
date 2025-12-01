import { crawlStockInfoSH, crawlStockInfoSZ, crawlStockInfoBJ } from './tasks/all-info';
import { EventEmitter } from 'events';
import PQueue from 'p-queue';
import { retry } from '../promise-tool';

interface MyEvents {
    "crawl:all-info": [];
}

const EventMinInterval = 1000 * 60;

class AkEventEmitter extends EventEmitter<MyEvents> {
    private taskTimerMap = new Map<string, Parameters<typeof clearTimeout>[0]>();
    private lastEmitTimeMap = new Map<string, number>();
    emit<K extends keyof MyEvents>(eventName: K | keyof MyEvents, ...args: K extends keyof MyEvents ? MyEvents[K] : never): boolean {
        const lastEmitTime = this.lastEmitTimeMap.get(eventName) || 0;
        const diff = Date.now() - lastEmitTime;
        if (diff < EventMinInterval) {
            let timer = this.taskTimerMap.get(eventName);
            if (timer != null) {
                clearTimeout(timer);
            }
            timer = setTimeout(() => {
                this.taskTimerMap.delete(eventName);
                this.lastEmitTimeMap.set(eventName, Date.now());
                super.emit<K>(eventName, ...args);
            }, EventMinInterval - diff);
            this.taskTimerMap.set(eventName, timer);
            return false;
        } else {
            this.lastEmitTimeMap.set(eventName, Date.now());
            return super.emit<K>(eventName, ...args);
        }
    }
}
export const AkEmitter = new AkEventEmitter();
const queue = new PQueue({ concurrency: 1 });

AkEmitter.on("crawl:all-info", async () => {
    try {
        await Promise.all([
            retry(() => queue.add(() => crawlStockInfoSH()), { delay: 1000, retries: 3 }),
            retry(() => queue.add(() => crawlStockInfoSZ()), { delay: 1000, retries: 3 }),
            retry(() => queue.add(() => crawlStockInfoBJ()), { delay: 1000, retries: 3 }),
        ]);
        console.log("所有股票信息更新完成");
    } catch (error) {
        console.error("更新股票信息失败", error);
    }
});