import { z } from "zod";
import { crawlCLSNews } from "~~/server/utils/stock/source/aktools/cls-news";
import { tNews, tNewsEffect } from '~~/drizzle/schema/news';
import { tStockKeyword } from '~~/drizzle/schema/stock';
import { sql, desc, eq, isNull } from 'drizzle-orm';
import { runAiTask } from './common';
import { kvNews } from '~~/server/utils/redis/news';

const SystemPrompt = `你是专业的财经新闻分析模型，任务是从新闻中生成关键词以及对股票未来行情进行预测。

你的输出必须是标准 JSON，不能包含任何多余文本。

JSON 输出格式如下：
\`\`\`
[
    {
      "keyword": "关键词文本",
      "effect": -1 ~ +1 的浮点数,
      "confidence": 0 ~ 1 的浮点数,
      "reason": "简要说明判断依据",
    },
    ...
]
\`\`\`

字段要求：

1. keyword：
   - 受新闻影响的股票关键词
   - 关键词应具有区分度，如公司名、行业、产品、概念等可关联到股票关键词，避免过于宽泛的概念
   - 保证区分度的前提下，仅保留核心关键词，去除冗余描述

2. effect：
   受新闻影响，关键词对应股票未来行情评分：
   - +1：强烈利好，未来股价将涨停
   - 0：中性，未来股价将维持不变
   - -1：强烈利空，未来股价将跌停

3. confidence：
  模型对判断的置信度

4. 输出必须是严格合法 JSON，不得包含解释文字。
`;

export class NewsAnalyzer {
    async crawl() {
        const news = await crawlCLSNews();
        await db.insert(tNews).values(news).onConflictDoNothing();
        await this.analyze();
    }
    async analyze() {
        const news = await db.select({
            id: tNews.id,
            title: tNews.title,
            content: tNews.content,
            date: tNews.date,
        }).from(tNews)
            .where(isNull(tNews.analysis))
            .orderBy(desc(tNews.date))
            .limit(10);
        for (const item of news) {
            AiTaskQueue.add(() => this.#analyzeNews(item))
        }
    }
    async #analyzeNews(news: { id: string, title: string, content: string }) {
        const ok = await kvNews.lock(news.id);
        if (!ok) { return; }
        const analysis = await runAiTask(SystemPrompt, news.content, z.array(z.object({
            keyword: z.string(),
            effect: z.number().min(-1).max(1),
            confidence: z.number().min(0).max(1),
            reason: z.string(),
        })));
        await db.transaction(async (tx) => {
            const [updated] = await tx.update(tNews).set({ analysis }).where(eq(tNews.id, news.id)).returning({ id: tNews.id });
            if (!updated) { return; }
            await tx.delete(tNewsEffect).where(eq(tNewsEffect.news_id, news.id))
            for (const a of analysis) {
                const list = JSON.stringify([a])
                await tx.insert(tNewsEffect).select(
                    qb => qb.select({
                        id: sql`uuidv7()`.as('id'),
                        stock_id: tStockKeyword.stock_id,
                        news_id: sql`${news.id}`.as('news_id'),
                        analysis: sql`${list}::jsonb`.as('analysis'),
                        effect: sql`${tStockKeyword.weight} * ${a.effect}`.as('effect'),
                        created_at: sql`NOW()`.as('created_at'),
                        updated_at: sql`NOW()`.as('updated_at'),
                    }).from(tStockKeyword).where(eq(tStockKeyword.keyword, a.keyword))
                ).onConflictDoUpdate({
                    target: [tNewsEffect.stock_id, tNewsEffect.news_id],
                    set: {
                        analysis: sql`COALESCE(${tNewsEffect.analysis}, '[]') || EXCLUDED.analysis`,
                        effect: sql`CASE WHEN ABS(EXCLUDED.effect) > ABS(${tNewsEffect.effect}) THEN EXCLUDED.effect ELSE ${tNewsEffect.effect} END`,
                        updated_at: sql`NOW()`,
                    }
                });
            }
        })
    }
}
