import z from "zod";
import { tNews } from "~~/drizzle/schema/news";
import { tNewsEmbeddingCloudflareQwen3Embedding06b as tNewsEmbedding } from "~~/drizzle/schema/news_embedding";
import { eq, isNull, desc, sql } from "drizzle-orm";
import { useProducerConsumer } from "~~/server/utils/task/utils/producer-consumer";
import { MESSAGE_QUEUE_KEY } from "~~/server/utils/task/utils/keys";
import { embed } from "ai";
import { aiProvider } from "~~/server/utils/ai/provider";

const embeddingModel = aiProvider.cloudflare.embeddingModel("workers-ai/@cf/qwen/qwen3-embedding-0.6b");

export function createNewsEmbeddingTaskUnit() {
    return useProducerConsumer({
        key: MESSAGE_QUEUE_KEY.NEWS_EMBEDDING,
        groupName: "embedding",
        messageSchema: z.object({ id: z.string() }),
        async produce(num: number = 20) {
            return db
                .select({ id: tNews.id })
                .from(tNews)
                .leftJoin(tNewsEmbedding, eq(tNews.id, tNewsEmbedding.news_id))
                .where(isNull(tNewsEmbedding.id))
                .orderBy(desc(tNews.id))
                .limit(num);
        },
        async consume(item) {
            const count = await db.$count(tNewsEmbedding, eq(tNewsEmbedding.news_id, item.id));
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
            const embedding = await embedNewsContent(news.content);
            const { norm, vector } = L2Normalize(embedding);
            await db.transaction(async (tx) => {
                const count = await tx.$count(tNews, eq(tNews.id, news.id));
                if (count === 0) {
                    return;
                }
                await tx
                    .insert(tNewsEmbedding)
                    .values({
                        news_id: news.id,
                        embedding: vector,
                        norm: norm,
                    })
                    .onConflictDoUpdate({
                        target: tNewsEmbedding.news_id,
                        set: {
                            embedding: sql`EXCLUDED.embedding`,
                            norm: sql`EXCLUDED.norm`,
                            updated_at: sql`NOW()`,
                        },
                    });
            });
        },
    });
}

async function embedNewsContent(content: string) {
    const { embedding } = await embed({
        model: embeddingModel,
        value: content,
    });
    return embedding;
}
