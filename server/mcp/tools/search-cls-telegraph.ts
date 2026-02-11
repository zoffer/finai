import { z } from "zod";
import { eq, sql, innerProduct, asc, desc, lt } from "drizzle-orm";
import { tNews } from "~~/drizzle/schema/news";
import { tNewsEmbeddingCloudflareQwen3Embedding06b as tNewsEmbedding } from "~~/drizzle/schema/news_embedding";
import { embed } from "ai";
import { aiProvider } from "~~/server/utils/ai/provider";
import { L2Normalize } from "~~/server/utils/vector";

function formatDateString(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hour = String(d.getHours()).padStart(2, "0");
    const minute = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${minute}`;
}

async function embedQuery(query: string): Promise<number[]> {
    const res = await embed({
        model: aiProvider.cloudflare.embeddingModel("workers-ai/@cf/qwen/qwen3-embedding-0.6b"),
        value: query,
    });
    const { vector } = L2Normalize(res.embedding);
    return vector;
}

async function searchNewsByVector(vector: number[], options: { limit: number; sortBy: "similarity" | "date" }) {
    const sq = db.$with("sq").as(
        db
            .select({
                title: tNews.title,
                content: tNews.content,
                date: tNews.date,
                // Note: <#> returns the negative inner product since Postgres only supports ASC order index scans on operators
                cosine: innerProduct(tNewsEmbedding.embedding, vector)
                    .mapWith((score: number) => Math.min(1, -score))
                    .as("cosine"),
            })
            .from(tNews)
            .innerJoin(tNewsEmbedding, eq(tNews.id, tNewsEmbedding.news_id)),
    );
    const orderBy = options.sortBy === "date" ? desc(sq.date) : asc(sq.cosine);
    return await db.with(sq).select().from(sq).where(lt(sq.cosine, -0.4)).orderBy(orderBy).limit(options.limit);
}

function formatSearchResults(
    list: Array<{ title: string; content: string; date: Date; cosine: number }>,
    query: string,
): string {
    let resultsText: string;
    if (list.length > 0) {
        resultsText = list
            .map((item, index) => {
                const title = item.title ? item.title.trim() : "无标题";
                return [
                    `## ${index + 1}. ${title}`,
                    `- 日期: ${formatDateString(item.date)}`,
                    `- 相似度: ${item.cosine.toFixed(4)}`,
                    "",
                    item.content,
                ].join("\n");
            })
            .join("\n\n---\n\n");
    } else {
        resultsText = "未找到匹配的新闻文章。";
    }
    return `# 搜索查询: "${query}"\n\n\n${resultsText}`;
}

export default defineMcpTool({
    description: "使用向量搜索以找到与查询最相关的财联社电报内容。",
    inputSchema: {
        q: z.string().describe("搜索查询，用于查找相关新闻文章"),
        limit: z.int().min(1).max(100).default(10).describe("返回的最大结果数（1-100，默认：10）"),
        sortBy: z
            .enum(["similarity", "date"])
            .default("similarity")
            .describe("排序方式：similarity-按相似度排序（默认），date-按时间排序"),
    },
    handler: async ({ q, limit, sortBy }) => {
        try {
            const vector = await embedQuery(q);
            const list = await searchNewsByVector(vector, { limit, sortBy });
            const resultsText = formatSearchResults(list, q);
            return {
                content: [{ type: "text", text: resultsText }],
            };
        } catch (error) {
            console.error(error);
            return {
                content: [{ type: "text", text: "服务器错误，请稍后重试。" }],
                isError: true,
            };
        }
    },
});
