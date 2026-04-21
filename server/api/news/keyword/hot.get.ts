import { eq, desc, sql, gt, avg, countDistinct } from "drizzle-orm";
import type { H3Event } from "h3";
import { tNews, tNewsEffect } from "~~/drizzle/schema/news";
import z from "zod";
import { apiParameterParse } from "~~/server/utils/zod/parse";


const zParameter = z.object({
    size: z.coerce.number<number>().int().min(1).max(100).default(10),
});

export default defineApiEventHandler(async (event: H3Event<{ query: z.input<typeof zParameter>; }>,) => {
    const query = await apiParameterParse(zParameter, getQuery(event));

    const data = await db.select({
        keyword: tNewsEffect.keyword,
        news_count: countDistinct(tNewsEffect.news_id).as("news_count"),
        avg_effect: avg(tNewsEffect.effect).mapWith((v) => Number(v || 0)),
    })
        .from(tNewsEffect)
        .innerJoin(tNews, eq(tNews.id, tNewsEffect.news_id))
        .where(gt(tNews.date, sql`now() - interval '3 days'`))
        .groupBy(tNewsEffect.keyword)
        .orderBy(desc(sql`news_count`))
        .limit(query.size);

    return { data };
});
