// API接口：获取股票详情
import { eq, and, gt, sql, asc } from 'drizzle-orm';
import type { H3Event } from "h3";
import { tStockKeyword } from "~~/drizzle/schema/stock";
import z from 'zod';
import { tNews, tNewsEffect } from '~~/drizzle/schema/news';

const zParameter = z.object({
    stock_id: z.string().trim(),
});

export default defineApiEventHandler(async (event: H3Event<{ query: z.input<typeof zParameter> }>) => {
    // 获取股票代码参数
    const { stock_id } = await apiParameterParse(zParameter, getQuery(event));

    const list = await db.select({
        count: sql`count(${tNews.id})`.mapWith(Number),
        effect: sql`sum(${tNewsEffect.effect} * ${tStockKeyword.weight})`.mapWith(Number),
        date: sql`(${tNews.date} AT TIME ZONE 'Asia/Shanghai')::date`.as('d'),
    }).from(tNewsEffect)
        .innerJoin(tNews, and(eq(tNewsEffect.news_id, tNews.id), gt(tNews.date, sql`now() - interval '365 days'`)))
        .innerJoin(tStockKeyword, and(eq(tStockKeyword.stock_id, stock_id), eq(tStockKeyword.keyword, tNewsEffect.keyword)))
        .groupBy(sql`d`)
        .orderBy(asc(sql`d`))

    return { data: list };
});