import { z } from "zod";
import { crawlXQStockInfo } from "~~/server/utils/stock/source/aktools/info-xq";
import { tStockKeyword, tStock, tStockDynamicData } from '~~/drizzle/schema/stock';
import { sql, and, eq, max, or, lt, isNull } from 'drizzle-orm';
import { aiProvider } from '~~/server/utils/ai/provider';
import { generateText, Output } from 'ai';

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
- 输出格式必须是 **JSON 数组**
- 不要添加任何解释、无关文本或格式外内容
`;

async function generateStockKeywords(stock: { symbol: string, exchange: string, name: string }) {
    const infos = await crawlXQStockInfo(stock);
    infos.unshift({ item: "exchange", value: stock.exchange, })
    infos.unshift({ item: "symbol", value: stock.symbol, })

    const res = await generateText({
        model: aiProvider.zhipu.chatModel("glm-4.5-flash"),
        messages: [
            { role: "system", content: SystemPrompt },
            { role: "user", content: JSON.stringify(infos) },
        ],
        output: Output.json(),
        maxRetries: 0,
        temperature: 0,
    })

    return await z.array(z.object({
        keyword: z.string(),
        weight: z.number().min(0).max(1),
    })).parse(res.output)
}

async function saveStockKeywords(stock: { symbol: string, exchange: string, }, keywords: { keyword: string, weight: number }[]) {
    await db.transaction(async (tx) => {
        const stocks = await tx.select({ id: tStock.id })
            .from(tStock)
            .where(and(eq(tStock.symbol, stock.symbol), eq(tStock.exchange, stock.exchange)));
        if (stocks.length === 0) {
            throw new Error("Stock not found");
        }
        const id = stocks[0].id;
        const values = keywords.map(item => ({
            stock_id: id,
            keyword: item.keyword,
            weight: item.weight,
        }))
        await tx.delete(tStockKeyword).where(eq(tStockKeyword.stock_id, id));
        await tx.insert(tStockKeyword).values(values).onConflictDoUpdate({
            target: [tStockKeyword.stock_id, tStockKeyword.keyword],
            set: {
                weight: sql`EXCLUDED.weight`,
                updated_at: sql`NOW()`,
            }
        });
    })
}

export async function getStockKeywordTask(num: number = 10) {
    const stocks = await db
        .select({
            id: tStock.id,
            name: tStock.name,
            exchange: tStock.exchange,
            symbol: tStock.symbol,
        })
        .from(tStock)
        .leftJoin(tStockKeyword, eq(tStock.id, tStockKeyword.stock_id))
        .leftJoin(tStockDynamicData, eq(tStock.id, tStockDynamicData.stock_id))
        .groupBy(tStock.id)
        .having(or(
            isNull(max(tStockKeyword.updated_at)),
            lt(max(tStockKeyword.updated_at), sql`NOW() - INTERVAL '60 days'`),
        ))
        .orderBy(sql`${max(tStockDynamicData.turnover)} DESC NULLS LAST`)
        .limit(num);
    const tasks = new Map<string, () => Promise<void>>();
    for (const stock of stocks) {
        tasks.set(stock.id, async () => {
            console.log(`Analyze stock: ${stock.name}`);
            const keywords = await generateStockKeywords(stock);
            await saveStockKeywords(stock, keywords);
        })
    }
    return tasks;
}
