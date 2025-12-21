// API接口：获取股票详情
import { eq, and, gt, sql, desc } from 'drizzle-orm';
import type { H3Event } from "h3";
import z from 'zod';
import { tStockKeyword } from "~~/drizzle/schema/stock";
import { tNews, tNewsEffect } from '~~/drizzle/schema/news';

const zParameter = z.object({
    stock_id: z.string().trim(),
});

export default defineApiEventHandler(async (event: H3Event<{ query: z.input<typeof zParameter> }>) => {
    // 获取股票代码参数
    const { stock_id } = await apiParameterParse(zParameter, getQuery(event));

    const sq = db.$with('sq').as(
        db.select({
            id: tStockKeyword.id,
            news_id: tNewsEffect.news_id,
            effect: tNewsEffect.effect,
        })
            .from(tStockKeyword)
            .innerJoin(tNewsEffect, eq(tStockKeyword.keyword, tNewsEffect.keyword))
            .innerJoin(tNews, and(eq(tNewsEffect.news_id, tNews.id), gt(tNews.date, sql`now() - interval '24 hours'`)))
            .where(eq(tStockKeyword.stock_id, stock_id))
    )

    const list = await db.with(sq).select({
        id: tStockKeyword.id,
        stock_id: tStockKeyword.stock_id,
        keyword: tStockKeyword.keyword,
        weight: tStockKeyword.weight,
        news_count: sql`count(distinct ${sq.news_id})`.mapWith(Number).as('news_count'),
        sum_effect: sql`coalesce(sum(${sq.effect}), 0)`.mapWith(Number).as('sum_effect'),
        avg_effect: sql`coalesce(avg(${sq.effect}), 0)`.mapWith(Number).as('avg_effect'),
    }).from(tStockKeyword)
        .leftJoin(sq, eq(sq.id, tStockKeyword.id))
        .where(eq(tStockKeyword.stock_id, stock_id))
        .groupBy(tStockKeyword.id)
        .orderBy(desc(sql`news_count`), desc(tStockKeyword.weight))

    return { data: list };
});