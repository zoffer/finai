import { CronJob } from 'cron';
import { StockEmitter } from '../utils/stock/index';
import { TaskEmitter } from '../utils/task/index';

export default defineNitroPlugin(() => {
    const common = {
        start: true,
        timeZone: 'Asia/Shanghai',
    }
    CronJob.from({
        // 更新股票信息
        ...common,
        cronTime: '0 0 0/6 * * *',
        onTick: () => {
            StockEmitter.emit("stock:list");
        },
        runOnInit: !import.meta.dev,
    });
    CronJob.from({
        ...common,
        // 更新股票价格
        cronTime: '0 0 8-18 * * *',
        onTick: () => {
            StockEmitter.emit("stock:all-price");
        },
    });
    CronJob.from({
        ...common,
        cronTime: '0 * * * * *',
        onTick: async () => {
            await StockRankTool.v24h.rerank();
        },
    });
    CronJob.from({
        ...common,
        cronTime: '0 5/10 * * * *',
        onTick: () => {
            TaskEmitter.emit("stock/ai/keyword", 20);
        },
    });
    CronJob.from({
        ...common,
        cronTime: '0 0/10 * * * *',
        onTick: async () => {
            TaskEmitter.emit("news/ai/keyword", 20);
        },
    });
})