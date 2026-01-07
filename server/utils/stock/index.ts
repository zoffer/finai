import { EventEmitter } from "events";
import PQueue from "p-queue";

interface MyEvents {
    "stock:list": [];
    "stock:all-price": [];
}
export const StockEmitter = new EventEmitter<MyEvents>();

const queue = new PQueue({ concurrency: 1, intervalCap: 5, interval: 1000 * 60 });

StockEmitter.on("stock:list", async () => {
    queue.add(async () => {
        const res = await crawlStockInfoSH();
        await StockCache.saveStock(res);
    });
    queue.add(async () => {
        const res = await crawlStockInfoSZ();
        await StockCache.saveStock(res);
    });
    queue.add(async () => {
        const res = await crawlStockInfoBJ();
        await StockCache.saveStock(res);
    });
});

StockEmitter.on("stock:all-price", async () => {
    queue.add(async () => {
        try {
            console.log("更新股票实时价格");
            const res = await crawlStockRealTimePrice();
            await StockCache.saveStockDynamicData(res);
        } catch (error) {
            console.error("更新股票实时价格失败");
            console.error(error);
        }
    });
});
