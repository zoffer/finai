import { z } from "zod";
import { aiProvider } from "~~/server/utils/ai/provider";
import { generateText, Output } from "ai";

const SystemPrompt = `你是专业的财经新闻分析模型，任务是从新闻中生成关键词以及对股票未来行情进行预测。

你的输出必须是标准 JSON，不能包含任何多余文本。

JSON 输出格式如下：
\`\`\`
[
    {
      "keyword": "关键词文本",
      "effect": 浮点数，区间[-1,1],
      "confidence": 浮点数，区间[0,1],
      "reason": "简要说明判断依据",
    },
    ...
]
\`\`\`

字段要求：

1. keyword：
   - 受新闻影响的股票关键词。
   - 关键词应具有区分度，如公司名、行业、产品、概念等可关联到股票关键词，避免过于宽泛的概念。
   - 保证区分度的前提下，仅保留核心关键词，去除冗余描述。

2. effect：
受新闻影响，关键词对应股票未来行情评分（数值区间[-1,1]）。
以下数值仅做说明，评分数值应保证精确度：
  - 1：强烈利好，股价将会涨停。
  - 0：中性，股价将会维持不变。
  - -1：强烈利空，股价将会跌停。


3. confidence：
模型对判断的置信度（数值区间[0,1]）

注意：请严格仅输出标准JSON字符串，无任何其他文字、注释、说明、格式标记（如\`\`\`json），无需换行以外的多余空格。
`;

export async function analyzeNews(news: { id: string; title: string; content: string }) {
    const res = await generateText({
        model: aiProvider.cloudflare.chatModel("workers-ai/@cf/qwen/qwen3-30b-a3b-fp8"),
        messages: [
            { role: "system", content: SystemPrompt },
            { role: "user", content: news.content },
        ],
        output: Output.json(),
        temperature: 0.2,
    });
    const analysis = await z
        .array(
            z.object({
                keyword: z.string(),
                effect: z.number().min(-1).max(1),
                confidence: z.number().min(0).max(1),
                reason: z.string(),
            })
        )
        .parse(res.output);
    return analysis;
}
