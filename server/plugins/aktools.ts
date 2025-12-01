import { AkEmitter } from '../utils/aktools/index';

export default defineNitroPlugin((nitroApp) => {
    console.log('注册定时任务')
    // 每小时更新一次股票信息
    const func = async () => {
        await AkEmitter.emit("crawl:all-info");
    }
    setInterval(func, 1000 * 60 * 60);
})