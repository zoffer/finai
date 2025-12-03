import { EventEmitter } from 'events';
import PQueue from 'p-queue';
import { Stock } from '~~/drizzle/schema/stock';
import { eq } from 'drizzle-orm';

interface MyEvents {
    "stock:list": [];
    "stock:all-price": [];
    "stock:some-price": [];
    "view:stock": [string];
}
export const StockEmitter = new EventEmitter<MyEvents>();

const queue = new PQueue({ concurrency: 1, intervalCap: 5, interval: 1000 * 60 });

StockEmitter.on("stock:list", async () => {
    queue.add(async () => {
        const res = await crawlStockInfoSH()
        await StockCache.saveStock(res);
    })
    queue.add(async () => {
        const res = await crawlStockInfoSZ()
        await StockCache.saveStock(res);
    })
    queue.add(async () => {
        const res = await crawlStockInfoBJ()
        await StockCache.saveStock(res);
    })
});

StockEmitter.on("stock:all-price", async () => {
    queue.add(async () => {
        try {
            console.log("更新股票实时价格");
            const res = await crawlStockRealTimePrice()
            await StockCache.saveStockPrice(res);
        } catch (error) {
            console.error("更新股票实时价格失败");
            console.error(error);
        }
    })
});

StockEmitter.on("stock:some-price", async () => {
    const stocks = await db.select({
        id: Stock.id,
        symbol: Stock.symbol,
        exchange: Stock.exchange
    }).from(Stock).where(eq(Stock.exchange, "SH")).limit(3);

    if (stocks.length === 0) {
        console.error("股票不存在");
        return;
    }
    const codes = stocks.map((s) => s.symbol);
    await queue.add(async () => {
        try {
            const res = await fetchStockQuotes("SH", codes)
            await StockCache.saveStockPrice(res);
        } catch (error) {
            console.error("更新股票实时价格失败");
            console.error(error);
        }
    });
});