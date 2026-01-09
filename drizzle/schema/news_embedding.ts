import { sql } from "drizzle-orm";
import { pgTable, text, index, vector, real } from "drizzle-orm/pg-core";
import { sqlTimestamps } from "./common";

const tableFactory = function (modelName: string, dimensions: number) {
    return pgTable(
        `news_embedding__${modelName}`,
        {
            id: text()
                .primaryKey()
                .default(sql`uuidv7()`),
            news_id: text().unique().notNull(), // 关联到financial_news表的外键
            embedding: vector({ dimensions }).notNull(), // 嵌入向量，需进行L2归一化
            norm: real().notNull(), // 向量的L2范数
            ...sqlTimestamps,
        },
        (t) => [index().using("hnsw", t.embedding.op("vector_ip_ops"))]
    );
};

export const tNewsEmbeddingCloudflareQwen3Embedding06b = tableFactory("cloudflare_qwen3_embedding_0_6b", 1024);
