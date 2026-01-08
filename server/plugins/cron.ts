import { CronJob } from "cron";
import { TaskEmitter } from "~~/server/utils/task/index";
import { StockRankTool } from "~~/server/utils/redis/rank-tool";

export default defineNitroPlugin(() => {
    const common = {
        start: true,
        timeZone: "Asia/Shanghai",
    };
    CronJob.from({
        // 更新股票信息
        ...common,
        cronTime: "0 0 0/6 * * *",
        onTick: () => {
            TaskEmitter.emit("crawl/stock/info/all");
        },
        runOnInit: !import.meta.dev,
    });
    CronJob.from({
        ...common,
        // 更新股票价格
        cronTime: "0 0 8-18 * * *",
        onTick: () => {
            TaskEmitter.emit("crawl/stock/price/all");
        },
    });
    CronJob.from({
        ...common,
        cronTime: "0 0 * * * *",
        onTick: async () => {
            await StockRankTool.v24h.rerank();
        },
    });
    CronJob.from({
        ...common,
        cronTime: "0 5/10 * * * *",
        runOnInit: import.meta.dev,
        onTick: () => {
            TaskEmitter.emit("stock/ai/keyword");
        },
    });
    CronJob.from({
        ...common,
        cronTime: "0 0/10 * * * *",
        onTick: () => {
            TaskEmitter.emit("crawl/news");
        },
    });
});
