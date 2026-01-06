import { pgTable, text, index, vector } from "drizzle-orm/pg-core";
import { sqlTimestamps } from "./common";

export const tNewsEmbeddingCloudflareQwen3Embedding06b = pgTable(
    "news_embedding__cloudflare_qwen3_embedding_0_6b",
    {
        news_id: text().unique().notNull(), // 关联到financial_news表的外键
        embedding: vector({ dimensions: 1024 }).notNull(),
        ...sqlTimestamps,
    },
    (t) => [index().using("hnsw", t.embedding.op("vector_cosine_ops"))]
);
