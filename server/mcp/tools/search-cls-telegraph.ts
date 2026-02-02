import { z } from "zod";
import { eq, sql, innerProduct, asc } from "drizzle-orm";
import { tNews } from "~~/drizzle/schema/news";
import { tNewsEmbeddingCloudflareQwen3Embedding06b as tNewsEmbedding } from "~~/drizzle/schema/news_embedding";
import { embed } from "ai";
import { aiProvider } from "~~/server/utils/ai/provider";
import { L2Normalize } from "~~/server/utils/vector";

const escapeMarkdownTable = (text: string): string => {
    return text.replace(/\|/g, "\\|").replace(/\n/g, " ").replace(/\r/g, " ");
};

export default defineMcpTool({
    description: "使用向量搜索以找到与查询最相关的财联社电报内容。",
    inputSchema: {
        q: z.string().describe("搜索查询，用于查找相关新闻文章"),
        limit: z.int().min(1).max(100).default(10).describe("返回的最大结果数（1-100，默认：10）"),
    },
    outputSchema: {
        q: z.string(),
        data: z.array(
            z.object({
                title: z.string(),
                date: z.coerce.string<Date>(),
                cosine_distance: z.number(),
                content: z.string(),
            }),
        ),
    },
    handler: async ({ q, limit }) => {
        const res = await embed({
            model: aiProvider.cloudflare.embeddingModel("workers-ai/@cf/qwen/qwen3-embedding-0.6b"),
            value: q,
        });
        const { vector } = L2Normalize(res.embedding);

        const list = await db
            .select({
                title: tNews.title,
                content: tNews.content,
                date: tNews.date,
                // Note: <#> returns the negative inner product since Postgres only supports ASC order index scans on operators
                cosine_distance: innerProduct(tNewsEmbedding.embedding, vector)
                    .mapWith((score: number) => Math.max(0, 1 + score))
                    .as("cosine_distance"),
            })
            .from(tNews)
            .innerJoin(tNewsEmbedding, eq(tNews.id, tNewsEmbedding.news_id))
            .orderBy(asc(sql`cosine_distance`))
            .limit(limit);

        let resultsText: string;
        if (list.length > 0) {
            const rows = list
                .map((item, index) => {
                    const cosineDistance = Math.abs(item.cosine_distance || 0).toFixed(4);
                    const content = item.content?.substring(0, 200) ?? "";
                    const truncated = item.content && item.content.length > 200 ? "..." : "";
                    return `| ${index + 1} | ${escapeMarkdownTable(item.title)} | ${item.date.toISOString()} | ${cosineDistance} | ${escapeMarkdownTable(content)}${truncated} |`;
                })
                .join("\n");
            resultsText = [
                "| 序号 | 标题 | 日期 | 余弦距离 | 内容 |",
                "|---|--------|------|----------------|------|",
                rows,
            ].join("\n");
        } else {
            resultsText = "未找到匹配的新闻文章。";
        }

        return {
            content: [{ type: "text", text: `搜索查询: "${q}"\n\n结果:\n${resultsText}` }],
            structuredContent: {
                q,
                data: list,
            },
        };
    },
});
