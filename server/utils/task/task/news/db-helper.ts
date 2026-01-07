import { tNews, tNewsEffect } from "~~/drizzle/schema/news";
import { db } from "~~/server/utils/db";
import { and, desc, eq, gt, sql, isNull } from "drizzle-orm";

export const newsDbHelper = {
    save: async (data: Array<{ title: string; content: string; date: Date }>) => {
        await db.insert(tNews).values(data).onConflictDoNothing();
    },
    getUnprocessed(num = 100) {
        return db
            .select({ id: tNews.id })
            .from(tNews)
            .leftJoin(tNewsEffect, eq(tNews.id, tNewsEffect.news_id))
            .where(and(gt(tNews.date, sql`now() - interval '24 hours'`), isNull(tNewsEffect.id)))
            .groupBy(tNews.id)
            .orderBy(desc(tNews.date))
            .limit(num);
    },
    async getNews(id: string) {
        const list = await db
            .select({ id: tNews.id, title: tNews.title, content: tNews.content })
            .from(tNews)
            .where(eq(tNews.id, id))
            .limit(1);
        if (list.length === 0) {
            return null;
        }
        return list[0];
    },
    async countSubitem(news_id: string, table: typeof tNewsEffect) {
        return db.$count(table, eq(table.news_id, news_id));
    },
    async saveKeywordEffect(
        news: { id: string },
        analysis: { keyword: string; effect: number; confidence: number; reason: string }[]
    ) {
        await db.transaction(async (tx) => {
            const count = await tx.$count(tNews, eq(tNews.id, news.id));
            if (count === 0) {
                return;
            }
            await tx.delete(tNewsEffect).where(eq(tNewsEffect.news_id, news.id));
            await tx.insert(tNewsEffect).values(
                analysis.map((a) => ({
                    news_id: news.id,
                    keyword: a.keyword,
                    effect: a.effect,
                    confidence: a.confidence,
                    reason: a.reason,
                }))
            );
        });
    },
};
