import { Stock, StockPrice } from "~~/drizzle/schema/stock";
import { sql } from "drizzle-orm";

export type StockData = {
    symbol: string;
    name: string;
    exchange: string;
    industry: string;
}

export type StockPriceData = {
    symbol: string, // 股票代码
    exchange: string, // 交易所
    price: number; // 当前价格
    open: number; // 开盘价
    high: number; // 最高价
    low: number; // 最低价
    volume: number; // 成交量
    data_time: Date, // 数据时间戳
}

export const StockCache = {
    async saveStock(data: Array<StockData>) {
        await db.insert(Stock).values(data).onConflictDoUpdate({
            target: [Stock.symbol, Stock.exchange],
            set: {
                name: sql`EXCLUDED.name`,
                industry: sql`EXCLUDED.industry`,
                updated_at: sql`NOW()`
            },
        })
    },
    async saveStockPrice(list: Array<StockPriceData>) {

        const stocks = await db.select({
            id: Stock.id,
            symbol: Stock.symbol,
            exchange: Stock.exchange
        }).from(Stock)
            .where(sql`${Stock.symbol} IN ${list.map((item) => item.symbol)}`);

        const stockMap = new Map(stocks.map((stock) => [stock.exchange + stock.symbol, stock.id]));

        const data: Array<Omit<StockPriceData, "symbol" | "exchange"> & { stock_id: string }> = []

        for (const item of list) {
            const stockId = stockMap.get(item.exchange.toUpperCase() + item.symbol.toUpperCase())
            if (stockId) {
                data.push({
                    stock_id: stockId,
                    price: item.price,
                    open: item.open,
                    high: item.high,
                    low: item.low,
                    volume: item.volume,
                    data_time: item.data_time,
                })
            }
        }

        await db.insert(StockPrice).values(data).onConflictDoUpdate({
            target: [StockPrice.stock_id],
            set: {
                price: sql`EXCLUDED.price`,
                open: sql`EXCLUDED.open`,
                high: sql`EXCLUDED.high`,
                low: sql`EXCLUDED.low`,
                volume: sql`EXCLUDED.volume`,
                data_time: sql`EXCLUDED.data_time`,
                updated_at: sql`NOW()`
            },
        })
    }
}
