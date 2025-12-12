// API接口：获取股票详情
import { eq, and, gt, sql, desc } from 'drizzle-orm';
import type { H3Event } from "h3";
import { tStockKeyword } from "~~/drizzle/schema/stock";
import z from 'zod';
import { tNews, tNewsEffect } from '~~/drizzle/schema/news';

const zParameter = z.object({
  id: z.string().trim(),
});

export default defineApiEventHandler(async (event: H3Event<{ query: z.input<typeof zParameter> }>) => {
  // 获取股票代码参数
  const result = zParameter.safeParse(getQuery(event));
  if (!result.success) {
    return new ApiError({
      code: "invalid_parameter",
      message: z.prettifyError(result.error)
    });
  }
  const query = result.data;
  type NewsKeywordItem = {
    keyword: string,
    effect: number, // -1 ~ 1, 负数为利空，正数为利好，0为中性
    confidence: number, // 0 ~ 1, 判断的置信度
    reason: string // 判断依据简要说明
  }
  // 查询股票详情
  const list = await db.select({
    id: tNews.id,
    title: tNews.title,
    content: tNews.content,
    date: tNews.date,
    keywords: sql<Array<NewsKeywordItem>>`json_agg(json_build_object('keyword', ${tNewsEffect.keyword}, 'effect', ${tNewsEffect.effect} * ${tStockKeyword.weight}, 'confidence', ${tNewsEffect.confidence}, 'reason', ${tNewsEffect.reason}))`,
  })
    .from(tNews)
    .innerJoin(tNewsEffect, eq(tNews.id, tNewsEffect.news_id))
    .innerJoin(tStockKeyword, and(eq(tStockKeyword.stock_id, query.id), eq(tStockKeyword.keyword, tNewsEffect.keyword)))
    .where(gt(tNews.date, sql`now() - interval '24 hours'`))
    .groupBy(tNews.id)
    .orderBy(desc(tNews.date))

  return { data: list };
});