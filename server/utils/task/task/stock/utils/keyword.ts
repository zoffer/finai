import { z } from "zod";
import { crawlXQStockInfo } from "~~/server/utils/data-source/arktools/info-xq";
import { aiProvider } from "~~/server/utils/ai/provider";
import { generateText, Output } from "ai";

export async function generateStockKeywords(stock: { symbol: string; exchange: string; name: string }) {
    const infos = await crawlXQStockInfo(stock);
    infos.unshift({ item: "exchange", value: stock.exchange });
    infos.unshift({ item: "symbol", value: stock.symbol });

    const SystemPrompt = (await useStorage("assets:server").getItem("ai/prompts/stock-keyword-generation.txt")) as string;

    const res = await generateText({
        model: aiProvider.zhipu.chatModel("GLM-4.5-Flash"),
        messages: [
            { role: "system", content: SystemPrompt },
            { role: "user", content: JSON.stringify(infos) },
        ],
        output: Output.json(),
        maxRetries: 0,
        temperature: 0,
    });

    return z
        .array(
            z.object({
                keyword: z.string(),
                weight: z.number().min(0).max(1),
            }),
        )
        .parse(res.output);
}
