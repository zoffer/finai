import { z } from "zod";
import { crawlXQStockInfo } from "~~/server/utils/data-source/arktools/info-xq";
import { tStockKeyword, tStock, tStockDynamicData } from "~~/drizzle/schema/stock";
import { sql, and, eq, max, or, lt, isNull } from "drizzle-orm";
import { aiProvider } from "~~/server/utils/ai/provider";
import { generateText, Output } from "ai";

const SystemPrompt = `
你是一名专业的证券分析与自然语言处理（NLP）助手。

你的目标是：根据输入的上市公司信息，结合你知道的关于该公司的确切事实，生成一套用于“新闻匹配 → 股票选股”场景的关键词数据

你的输出必须是标准 JSON，不能包含任何多余文本。

【输出格式】
\`\`\`
[
    {
      "keyword": "关键词文本",
      "weight": 浮点数，区间[0,1],
    },
    ...
]
\`\`\`

【字段要求】
1. keyword：
   - 关键字应基于确切的事实，不能包含猜测内容
   - 关键词应具有区分度，如公司名、行业、产品、概念等可关联到股票关键词，避免出现普遍或宽泛的概念
   - 保证区分度的前提下，仅保留核心关键词，去除冗余描述

3. weight：
   - 关键词与该公司的关联程度
   - 浮点数，区间[0,1]

【输出要求】
- 根据公司业务复杂度自动决定关键词数量
- 输出格式必须是 **JSON 数组**，无任何其他文字、注释、说明、格式标记（如"\`\`\`json"）
`;

export async function generateStockKeywords(stock: { symbol: string; exchange: string; name: string }) {
    const infos = await crawlXQStockInfo(stock);
    infos.unshift({ item: "exchange", value: stock.exchange });
    infos.unshift({ item: "symbol", value: stock.symbol });

    const res = await generateText({
        model: aiProvider.zhipu.chatModel("glm-4.5-flash"),
        messages: [
            { role: "system", content: SystemPrompt },
            { role: "user", content: JSON.stringify(infos) },
        ],
        output: Output.json(),
        maxRetries: 0,
        temperature: 0,
    });

    return await z
        .array(
            z.object({
                keyword: z.string(),
                weight: z.number().min(0).max(1),
            })
        )
        .parse(res.output);
}
