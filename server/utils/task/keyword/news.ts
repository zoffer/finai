import { z } from "zod";
import { crawlCLSNews } from "~~/server/utils/stock/source/aktools/cls-news";
import { tNews, tNewsEffect } from '~~/drizzle/schema/news';
import { desc, eq, and, gt, sql } from 'drizzle-orm';
import { zhipuAI } from '~~/server/utils/ai/provider/zhipu';

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

4. 输出必须是严格合法 JSON，不得包含解释文字。
`;


async function crawlNews() {
    const news = await crawlCLSNews();
    await db.insert(tNews).values(news).onConflictDoNothing();
}

async function analyzeNews(news: { id: string, title: string, content: string }) {
    const response = await zhipuAI.chat({
        messages: [
            { role: "system", content: SystemPrompt },
            { role: "user", content: news.content },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
    });
    const content = response.choices[0].message.content || ""
    const analysis = await z.array(z.object({
        keyword: z.string(),
        effect: z.number().min(-1).max(1),
        confidence: z.number().min(0).max(1),
        reason: z.string(),
    })).parse(JSON.parse(content))
    return analysis;
}

async function saveAnalyze(news: { id: string }, analysis: { keyword: string; effect: number; confidence: number; reason: string; }[]) {
    await db.transaction(async (tx) => {
        const count = await tx.$count(tNews, eq(tNews.id, news.id));
        if (count === 0) { return; }
        await tx.delete(tNewsEffect).where(eq(tNewsEffect.news_id, news.id))
        await tx.insert(tNewsEffect).values(analysis.map(a => ({
            news_id: news.id,
            keyword: a.keyword,
            effect: a.effect,
            confidence: a.confidence,
            reason: a.reason,
        })))
    })
}

export async function getNewsKeywordTask(num = 10) {
    await crawlNews();
    const news = await db.select({
        id: tNews.id,
        title: tNews.title,
        content: tNews.content,
        date: tNews.date,
    }).from(tNews)
        .where(and(
            gt(tNews.date, sql`now() - interval '24 hours'`),
            eq(db.$count(tNewsEffect, eq(tNewsEffect.news_id, tNews.id)), 0),
        ))
        .orderBy(desc(tNews.date)).limit(num);
    const tasks = new Map<string, () => Promise<void>>();
    for (const item of news) {
        tasks.set(item.id, async () => {
            console.log(`Analyze news: ${item.title}`);
            const analysis = await analyzeNews(item);
            await saveAnalyze(item, analysis);
        })
    }
    return tasks;
}
