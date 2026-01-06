import { test, expect } from "vitest";
import { embeddingNews } from "../../server/utils/ai/embedding/news";

test("embeddingNews", async () => {
    expect(process.env.CF_AI_API_KEY).toBeDefined();
    const news = {
        id: "1",
        title: "测试新闻",
        content: "这是一个测试新闻内容",
    };
    const embedding = await embeddingNews(news);
    expect(embedding).toBeDefined();
    expect(embedding.length).toBe(1024);
});
