// API接口：获取股票列表（支持分页）
import { eq } from 'drizzle-orm';
import type { H3Event } from "h3";
import { getQuery } from "h3";
import { Stock, StockPrice } from "~~/drizzle/schema/stock";

export default defineApiEventHandler(async (event: H3Event) => {
  // 获取分页参数，设置默认值
  const { page = 1, limit = 20 } = getQuery(event) || {};

  // 确保参数是有效的数字
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 20;

  // 计算偏移量
  const offset = (pageNum - 1) * limitNum;

  // 获取总记录数
  const total = await db.$count(Stock);

  // 获取分页数据
  const stocks = await db.select({
    id: Stock.id,
    symbol: Stock.symbol,
    exchange: Stock.exchange,
    name: Stock.name,
    prices: StockPrice
  })
    .from(Stock)
    .leftJoin(StockPrice, eq(Stock.id, StockPrice.stock_id)).limit(limitNum).offset(offset);

  // 返回分页结果
  return {
    data: stocks,
    pagination: {
      total: total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    }
  };
});