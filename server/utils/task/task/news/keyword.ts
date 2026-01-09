import z from "zod";
import { analyzeNews } from "./utils/keywork";
import { tNewsEffect } from "~~/drizzle/schema/news";
import { eq, and, gt, isNull, desc, sql } from "drizzle-orm";
import { useProducerConsumer } from "~~/server/utils/task/utils/producer-consumer";
import { MESSAGE_QUEUE_KEY } from "~~/server/utils/task/utils/keys";
import { tNews } from "~~/drizzle/schema/news";

export function createNewsKeywordTaskUnit() {
    return useProducerConsumer({
        key: MESSAGE_QUEUE_KEY.NEWS_KEYWORD,
        groupName: "keyword",
        messageSchema: z.object({ id: z.string() }),
        async produce(num: number = 100) {
            return db
                .select({ id: tNews.id })
                .from(tNews)
                .leftJoin(tNewsEffect, eq(tNews.id, tNewsEffect.news_id))
                .where(and(gt(tNews.date, sql`now() - interval '24 hours'`), isNull(tNewsEffect.id)))
                .groupBy(tNews.id)
                .orderBy(desc(tNews.date))
                .limit(num);
        },
        async consume(item) {
            const count = await db.$count(tNewsEffect, eq(tNewsEffect.news_id, item.id));
            if (count > 0) {
                return;
            }
            const [news] = await db
                .select({ id: tNews.id, title: tNews.title, content: tNews.content })
                .from(tNews)
                .where(eq(tNews.id, item.id))
                .limit(1);
            if (news == null) {
                return;
            }
            console.log(`analyze news: ${news.title}`);
            const effects = await analyzeNews(news);
            await db.transaction(async (tx) => {
                const count = await tx.$count(tNews, eq(tNews.id, news.id));
                if (count === 0) {
                    return;
                }
                await tx.delete(tNewsEffect).where(eq(tNewsEffect.news_id, news.id));
                await tx.insert(tNewsEffect).values(
                    effects.map((a) => ({
                        news_id: news.id,
                        keyword: a.keyword,
                        effect: a.effect,
                        confidence: a.confidence,
                        reason: a.reason,
                    }))
                );
            });
        },
    });
}
