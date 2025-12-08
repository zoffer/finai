import { tStock, tStockDynamicData } from "~~/drizzle/schema/stock";
import { sql, inArray } from "drizzle-orm";

export type StockData = {
    symbol: string;
    name: string;
    exchange: string;
    industry: string;
}

export type DynamicData = {
    // 市场信息
    symbol: string, // 股票代码
    exchange: string, // 交易所
    price: number; // 当前价格
    open: number; // 开盘价
    high: number; // 最高价
    low: number; // 最低价
    volume: number; // 成交量
    turnover: number; // 成交额
    market_data_time: Date, // 数据时间戳
}

function normalization(val: number, range: number) {
    return (val / range) || 0;
}

function calcHeatScore(item: DynamicData, visits_24h: number) {
    let score = 0;
    score += 0.6 * normalization(Math.log(item.turnover + 1), 20); // 成交额分, log(1千亿) ~= 25
    score += 0.3 * normalization((item.high - item.low) / item.open, 0.1); // 价格波动分
    score += 0.1 * normalization(Math.log(visits_24h + 1), 5); // 24小时访问量分
    return score;
}

export const StockCache = {
    async saveStock(data: Array<StockData>) {
        await db.insert(tStock).values(data).onConflictDoUpdate({
            target: [tStock.symbol, tStock.exchange],
            set: {
                name: sql`EXCLUDED.name`,
                industry: sql`EXCLUDED.industry`,
                updated_at: sql`NOW()`
            },
        })
    },
    async saveStockDynamicData(list: Array<DynamicData>) {

        const stocks = await db.select({
            id: tStock.id,
            symbol: tStock.symbol,
            exchange: tStock.exchange
        }).from(tStock)
            .where(inArray(tStock.symbol, list.map((item) => item.symbol.toUpperCase())));

        const stockMap = new Map(stocks.map((stock) => [stock.exchange.toUpperCase() + stock.symbol.toUpperCase(), stock.id]));

        const data: Array<Omit<DynamicData, "symbol" | "exchange"> & { stock_id: string, visits_24h: number, heat_score: number, }> = []

        for (const item of list) {
            const stockId = stockMap.get(item.exchange.toUpperCase() + item.symbol.toUpperCase())
            if (stockId) {
                const visits_24h = await StockRankTool.v24h.count(stockId);
                data.push({
                    stock_id: stockId,
                    price: item.price,
                    open: item.open,
                    high: item.high,
                    low: item.low,
                    volume: item.volume,
                    turnover: item.turnover,
                    market_data_time: item.market_data_time,
                    visits_24h,
                    heat_score: calcHeatScore(item, visits_24h),
                })
            }
        }

        await db.insert(tStockDynamicData).values(data).onConflictDoUpdate({
            target: [tStockDynamicData.stock_id],
            set: {
                price: sql`EXCLUDED.price`,
                open: sql`EXCLUDED.open`,
                high: sql`EXCLUDED.high`,
                low: sql`EXCLUDED.low`,
                volume: sql`EXCLUDED.volume`,
                turnover: sql`EXCLUDED.turnover`,
                market_data_time: sql`EXCLUDED.market_data_time`,
                visits_24h: sql`EXCLUDED.visits_24h`,
                heat_score: sql`EXCLUDED.heat_score`,
                updated_at: sql`NOW()`
            },
        })
    }
}
