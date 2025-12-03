// API接口：获取股票详情
import { eq } from 'drizzle-orm';
import type { H3Event } from "h3";
import { getRouterParam } from "h3";
import { Stock, StockPrice } from "~~/drizzle/schema/stock";

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
    price: StockPrice.price,
    open: StockPrice.open,
    high: StockPrice.high,
    low: StockPrice.low,
    volume: StockPrice.volume,
    data_time: StockPrice.data_time
  })
    .from(Stock)
    .leftJoin(StockPrice, eq(Stock.id, StockPrice.stock_id))
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

  // 构建响应数据
  const responseData = {
    id: stock.id,
    symbol: stock.symbol,
    exchange: stock.exchange,
    name: stock.name,
    industry: stock.industry,
    price: stock.price || 0,
    open: stock.open || 0,
    high: stock.high || 0,
    low: stock.low || 0,
    volume: stock.volume || 0,
    updatedAt: stock.data_time || new Date()
  };

  return {
    data: responseData
  };
});