import z from "zod";
import { analyzeNews } from "./utils/keywork";
import { tNewsEffect } from "~~/drizzle/schema/news";
import { eq, and, gt, isNull, desc, sql } from "drizzle-orm";
import { useProducerConsumer } from "~~/server/utils/task/utils/producer-consumer";
import { tNews } from "~~/drizzle/schema/news";
import { rd } from "~~/server/utils/redis/index";
import { REDIS_KEYS, MESSAGE_QUEUE_KEY } from "~~/server/utils/redis/keys";

const MAX_TRY = 16;
const RECORD_KEY = REDIS_KEYS.news.keywordDeliverRecord;

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
            const [numberOfRuns] = await rd
                .MULTI()
                .HINCRBY(RECORD_KEY, item.id, 1)
                .HEXPIRE(RECORD_KEY, item.id, 24 * 60 * 60, "NX")
                .EXEC<"typed">();
            if (numberOfRuns > MAX_TRY) {
                return;
            }
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
            rd.HDEL(RECORD_KEY, item.id);
        },
    });
}
