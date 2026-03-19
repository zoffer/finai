import { sql, notExists, eq } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { tNews, tNewsEffect } from "~~/drizzle/schema/news";
import { tNewsEmbeddingCloudflareQwen3Embedding06b } from "~~/drizzle/schema/news_embedding";

export async function cleanNews() {
    // 清理旧新闻
    await db.transaction(async (tx) => {
        await tx.delete(tNews).where(sql`${tNews.created_at} < NOW() - INTERVAL '3 months'`);
        await tx.delete(tNewsEffect).where(notExists(tx.select().from(tNews).where(eq(tNews.id, tNewsEffect.news_id))));
        await tx
            .delete(tNewsEmbeddingCloudflareQwen3Embedding06b)
            .where(notExists(tx.select().from(tNews).where(eq(tNews.id, tNewsEmbeddingCloudflareQwen3Embedding06b.news_id))));
    });
}
