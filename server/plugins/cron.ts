import { CronJob } from 'cron';
import { StockEmitter } from '../utils/stock/index';

export default defineNitroPlugin(() => {
    CronJob.from({
        // 更新股票信息
        cronTime: '0 0 0/6 * * *',
        onTick: () => {
            StockEmitter.emit("stock:list");
        },
        start: true,
        timeZone: 'Asia/Shanghai',
    });
    CronJob.from({
        // 更新股票价格
        cronTime: '0 0 8-18 * * *',
        onTick: () => {
            StockEmitter.emit("stock:all-price");
        },
        start: true,
        timeZone: 'Asia/Shanghai',
    });
    CronJob.from({
        // 更新股票价格
        cronTime: '0 * * * * *',
        onTick: async () => {
            await StockRankTool.$1h.rerank();
        },
        start: true,
        timeZone: 'Asia/Shanghai',
    });
})