// API接口：获取股票列表（支持分页）
import { eq, desc } from 'drizzle-orm';
import type { H3Event } from "h3";
import { getQuery } from "h3";
import { Stock, StockDynamicData } from "~~/drizzle/schema/stock";

export default defineApiEventHandler(async (event: H3Event<{
  query: { size?: string; }
}>) => {
  // 获取分页参数，设置默认值
  const { size = 100 } = getQuery(event) || {};

  const limitNum = parseInt(size as string) || 100;

  const stocks = await db.select({
    id: Stock.id,
    symbol: Stock.symbol,
    exchange: Stock.exchange,
    name: Stock.name,
    price: StockDynamicData.price,
    open: StockDynamicData.open,
    high: StockDynamicData.high,
    low: StockDynamicData.low,
    volume: StockDynamicData.volume,
    turnover: StockDynamicData.turnover,
    market_data_time: StockDynamicData.market_data_time,
    visits_24h: StockDynamicData.visits_24h,
    heat_score: StockDynamicData.heat_score,
  })
    .from(StockDynamicData)
    .innerJoin(Stock, eq(Stock.id, StockDynamicData.stock_id)).orderBy(desc(StockDynamicData.heat_score)).limit(limitNum);

  return { data: stocks };
});