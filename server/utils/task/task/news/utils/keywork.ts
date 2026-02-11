import { z } from "zod";
import { aiProvider } from "~~/server/utils/ai/provider";
import { generateText, Output } from "ai";

export async function analyzeNews(news: { id: string; title: string; content: string }) {
    const SystemPrompt = (await useStorage("assets:server").getItem("ai/prompts/news-keyword-analysis.txt")) as string;

    const res = await generateText({
        model: aiProvider.zhipu.chatModel("GLM-4.5-Flash"),
        messages: [
            { role: "system", content: SystemPrompt },
            { role: "user", content: news.content },
        ],
        output: Output.json(),
        temperature: 0.2,
    });
    return z
        .array(
            z.object({
                keyword: z.string(),
                effect: z.number().min(-1).max(1),
                confidence: z.number().min(0).max(1),
                reason: z.string(),
            }),
        )
        .parse(res.output);
}
