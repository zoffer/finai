import { aiProvider } from "~~/server/utils/ai/provider";
import { embed } from "ai";

export async function embeddingNews(news: { id: string; title: string; content: string }) {
    const res = await embed({
        model: aiProvider.cloudflare.embeddingModel("@cf/qwen/qwen3-embedding-0.6b"),
        value: news.content,
        maxRetries: 0,
    });
    return res.embedding;
}
