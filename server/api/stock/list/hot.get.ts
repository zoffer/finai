// API接口：获取股票列表（支持分页）
import { eq, desc } from 'drizzle-orm';
import type { H3Event } from "h3";
import { getQuery } from "h3";
import { tStock, tStockDynamicData } from "~~/drizzle/schema/stock";

export default defineApiEventHandler(async (event: H3Event<{
  query: { size?: string; }
}>) => {
  // 获取分页参数，设置默认值
  const { size = 100 } = getQuery(event) || {};

  const limitNum = parseInt(size as string) || 100;

  const stocks = await db.select({
    id: tStock.id,
    symbol: tStock.symbol,
    exchange: tStock.exchange,
    name: tStock.name,
    price: tStockDynamicData.price,
    open: tStockDynamicData.open,
    high: tStockDynamicData.high,
    low: tStockDynamicData.low,
    volume: tStockDynamicData.volume,
    turnover: tStockDynamicData.turnover,
    market_data_time: tStockDynamicData.market_data_time,
    visits_24h: tStockDynamicData.visits_24h,
    heat_score: tStockDynamicData.heat_score,
  })
    .from(tStockDynamicData)
    .innerJoin(tStock, eq(tStock.id, tStockDynamicData.stock_id)).orderBy(desc(tStockDynamicData.heat_score)).limit(limitNum);

  return { data: stocks };
});