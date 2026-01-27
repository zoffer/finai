import { eq, sql, innerProduct, asc } from "drizzle-orm";
import type { H3Event } from "h3";
import z from "zod";
import { tNews } from "~~/drizzle/schema/news";
import { tNewsEmbeddingCloudflareQwen3Embedding06b as tNewsEmbedding } from "~~/drizzle/schema/news_embedding";
import { apiParameterParse } from "~~/server/utils/zod/parse";
import { embed } from "ai";
import { aiProvider } from "~~/server/utils/ai/provider";

const zParameter = z.object({
    q: z.string().trim(),
    limit: z.number().int().min(1).max(100).default(10),
});

async function getEmbedding(q: string) {
    const res = await embed({
        model: aiProvider.cloudflare.embeddingModel("workers-ai/@cf/qwen/qwen3-embedding-0.6b"),
        value: q,
    });
    return res.embedding;
}

export default defineApiEventHandler(async (event: H3Event<{ query: z.input<typeof zParameter> }>) => {
    const query = await apiParameterParse(zParameter, getQuery(event));
    const vector = await getEmbedding(query.q);
    const list = await db
        .select({
            id: tNews.id,
            title: tNews.title,
            content: tNews.content,
            date: tNews.date,
            score: innerProduct(tNewsEmbedding.embedding, vector)
                .mapWith((score: number) => -score)
                .as("score"),
            // Note: <#> returns the negative inner product since Postgres only supports ASC order index scans on operators
        })
        .from(tNews)
        .innerJoin(tNewsEmbedding, eq(tNews.id, tNewsEmbedding.news_id))
        .orderBy(asc(sql`score`))
        .limit(query.limit);
    return { q: query.q, data: list };
});
