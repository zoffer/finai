// API接口：获取股票详情
import { eq } from 'drizzle-orm';
import type { H3Event } from "h3";
import { Stock, StockDynamicData } from "~~/drizzle/schema/stock";
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
    id: Stock.id,
    symbol: Stock.symbol,
    exchange: Stock.exchange,
    name: Stock.name,
    industry: Stock.industry,
    price: StockDynamicData.price,
    open: StockDynamicData.open,
    high: StockDynamicData.high,
    low: StockDynamicData.low,
    volume: StockDynamicData.volume,
    turnover: StockDynamicData.turnover,
    data_time: StockDynamicData.market_data_time
  })
    .from(StockDynamicData)
    .innerJoin(Stock, eq(Stock.id, StockDynamicData.stock_id))
    .where(eq(Stock.symbol, symbol))
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