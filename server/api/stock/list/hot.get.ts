import { eq, desc, ilike, or, sql, gt, and, sum, avg, countDistinct } from 'drizzle-orm';
import type { H3Event } from "h3";
import { tStock, tStockDynamicData, tStockKeyword } from "~~/drizzle/schema/stock";
import { tNews, tNewsEffect } from '~~/drizzle/schema/news';
import z from 'zod';

const zParameter = z.object({
  size: z.coerce.number<number>().int().min(1).max(1000).default(10),
  search: z.string().trim().optional(),
});

export default defineApiEventHandler(async (event: H3Event<{
  query: z.input<typeof zParameter>;
}>) => {
  const result = zParameter.safeParse(getQuery(event));
  if (!result.success) {
    return new ApiError({
      code: "invalid_parameter",
      message: z.prettifyError(result.error)
    });
  }
  const query = result.data;

  const sq = db.$with('sq').as(
    db.select({
      stock_id: tStockKeyword.stock_id,
      news_count: countDistinct(tNews.id).as('sq_news_count'),
      sum_effect: sum(sql`${tNewsEffect.effect} * ${tStockKeyword.weight}`).as('sq_sum_effect'),
      avg_effect: avg(sql`${tNewsEffect.effect} * ${tStockKeyword.weight}`).as('sq_avg_effect'),
    })
      .from(tStockKeyword)
      .innerJoin(tNewsEffect, eq(tStockKeyword.keyword, tNewsEffect.keyword))
      .innerJoin(tNews, and(eq(tNewsEffect.news_id, tNews.id), gt(tNews.date, sql`now() - interval '24 hours'`)))
      .groupBy(tStockKeyword.stock_id)
  )

  const t = db.with(sq).select({
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
    heat_score: tStockDynamicData.heat_score,
    news_count: sql`coalesce(${sq.news_count}, 0)`.mapWith(Number).as('news_count'),
    sum_effect: sql`coalesce(${sq.sum_effect}, 0)`.mapWith(Number).as('sum_effect'),
    avg_effect: sql`coalesce(${sq.avg_effect}, 0)`.mapWith(Number).as('avg_effect'),
  })
    .from(tStock)
    .innerJoin(tStockDynamicData, eq(tStock.id, tStockDynamicData.stock_id))
    .leftJoin(sq, eq(tStock.id, sq.stock_id))
    .where(query.search ? or(ilike(tStock.name, `%${query.search}%`), ilike(tStock.symbol, `%${query.search}%`)) : undefined)
    .as('t')

  const stocks = await db.select()
    .from(t)
    .orderBy(sql`(abs(${t.sum_effect}) * ln(coalesce(${t.turnover}, 0) + 1)) DESC NULLS LAST`, desc(t.turnover))
    .limit(query.size);

  return { data: stocks };
});