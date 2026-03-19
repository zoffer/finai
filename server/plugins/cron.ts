import { CronJob } from "cron";
import { TaskEmitter } from "~~/server/utils/task/index";
import { JWT_MANAGER } from "~~/server/utils/jwt/index";
import { cleanNews } from "~~/server/utils/task/task/clean/news";

export default defineNitroPlugin(() => {
    const common = {
        start: true,
        timeZone: "Asia/Shanghai",
    };
    CronJob.from({
        ...common,
        cronTime: "0 0 0/6 * * *",
        onTick: () => {
            // 更新股票信息
            TaskEmitter.emit("crawl/stock/info/all");
        },
        runOnInit: !import.meta.dev,
    });
    CronJob.from({
        ...common,
        cronTime: "8 8 8-18 * * *",
        onTick: () => {
            // 更新股票价格
            TaskEmitter.emit("crawl/stock/price/all");
        },
    });
    CronJob.from({
        ...common,
        cronTime: "0 5/10 * * * *",
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
    CronJob.from({
        ...common,
        cronTime: "0 0 3 * * *",
        onTick: async () => {
            // 轮换JWT密钥
            await JWT_MANAGER.rotateKeys();
        },
    });
    CronJob.from({
        ...common,
        cronTime: "3 3 3 * * *",
        runOnInit: import.meta.dev,
        onTick: async () => {
            // 清理旧新闻
            await cleanNews();
        },
    });
});
