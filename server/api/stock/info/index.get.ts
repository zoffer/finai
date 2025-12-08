// API接口：获取股票详情
import { eq } from 'drizzle-orm';
import type { H3Event } from "h3";
import { tStock, tStockDynamicData } from "~~/drizzle/schema/stock";
import { StockRankTool } from "~~/server/utils/stock/rank/index";

export default defineApiEventHandler(async (event: H3Event<{ query: { symbol: string } }>) => {
  // 获取股票代码参数
  const { symbol } = getQuery(event);

  if (!symbol) {
    return new ApiError({
      code: 'MISSING_SYMBOL_PARAM',
      message: '缺少股票代码参数'
    });
  }

  // 查询股票详情
  const stockData = await db.select({
    id: tStock.id,
    symbol: tStock.symbol,
    exchange: tStock.exchange,
    name: tStock.name,
    industry: tStock.industry,
    price: tStockDynamicData.price,
    open: tStockDynamicData.open,
    high: tStockDynamicData.high,
    low: tStockDynamicData.low,
    volume: tStockDynamicData.volume,
    turnover: tStockDynamicData.turnover,
    data_time: tStockDynamicData.market_data_time
  })
    .from(tStockDynamicData)
    .innerJoin(tStock, eq(tStock.id, tStockDynamicData.stock_id))
    .where(eq(tStock.symbol, symbol))
    .limit(1);

  if (!stockData || stockData.length === 0) {
    return new ApiError({
      code: 'STOCK_NOT_FOUND',
      message: '未找到指定股票'
    }).setHttpStatus(HTTP_STATUS.NOT_FOUND);
  }

  // 处理查询结果
  const stock = stockData[0];

  // 增加1天内的股票排名
  StockRankTool.v24h.incr(stock.id);

  return {
    data: stock
  };
});