import { eq, desc, exists, and, gt, sql } from "drizzle-orm";
import type { H3Event } from "h3";
import { tNews, tNewsEffect } from "~~/drizzle/schema/news";
import z from "zod";
import { apiParameterParse } from "~~/server/utils/zod/parse";


const zParameter = z.object({
    keyword: z.string().trim(),
    size: z.coerce.number<number>().int().min(1).max(100).default(100),
});

export default defineApiEventHandler(async (event: H3Event<{ query: z.input<typeof zParameter>; }>,) => {
    const query = await apiParameterParse(zParameter, getQuery(event));

    const sq = db.select()
        .from(tNewsEffect)
        .where(and(eq(tNewsEffect.keyword, query.keyword), eq(tNews.id, tNewsEffect.news_id)))

    const data = await db.select()
        .from(tNews)
        .where(and(
            gt(tNews.date, sql`now() - interval '3 days'`),
            exists(sq)
        ))
        .orderBy(desc(tNews.date))
        .limit(query.size);

    return { data };
});
