// API接口：获取股票列表（支持分页）
import type { H3Event } from "h3";
import { getQuery } from "h3";
import { count } from "drizzle-orm";
import { Stock } from "~~/drizzle/schema/schemas";

export default defineApiEventHandler(async (event: H3Event) => {
  // 获取分页参数，设置默认值
  const { page = 1, limit = 20 } = getQuery(event) || {};

  // 确保参数是有效的数字
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 20;

  // 计算偏移量
  const offset = (pageNum - 1) * limitNum;

  // 获取总记录数
  const total = await db.select({ count: count() }).from(Stock);

  // 获取分页数据
  const stocks = await db.select().from(Stock).limit(limitNum).offset(offset);

  // 返回分页结果
  return {
    data: stocks,
    pagination: {
      total: total[0]?.count || 0,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil((total[0]?.count || 0) / limitNum)
    }
  };
});