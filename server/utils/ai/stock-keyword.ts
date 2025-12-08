import { streamText } from "ai";
import { z } from "zod";
import { crawlXQStockInfo } from "~~/server/utils/stock/source/aktools/info-xq";
import { createDeepSeek } from '@ai-sdk/deepseek';
import { tStockKeyword, tStock, tStockDynamicData } from '~~/drizzle/schema/stock';
import { sql, and, eq, max, or, lt, isNull } from 'drizzle-orm';
import { runAiTask } from "./common";

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY,
});

const SystemPrompt = `你是一名专业的证券分析与自然语言处理（NLP）助手。

你的目标是：根据输入的某家上市公司信息，生成一套用于“新闻匹配 → 股票选股”场景的关键词数据

该关键词数据将作为股票基础数据进行保存。用于根据新闻内容定位受影响的股票，并通过关键词权重计算新闻对股价的影响程度。

【关键词】
每个关键词包含以下内容：
- keyword：关键词内容
- weight：关键词权重（0 ~ 1 的浮点数）

【输出要求】
- 根据公司业务复杂度自动决定关键词数量
- 输出格式必须是 **JSON 数组**
- 不要添加任何解释、无关文本或格式外内容
- 每个元素必须包含 keyword、weight 字段
`;

async function generateStockKeywords(stock: { symbol: string, exchange: string }) {
    console.log('Start processing stock keywords for', stock);
    const infos = await crawlXQStockInfo(stock);
    infos.push({ item: "symbol", value: stock.symbol, })
    infos.push({ item: "exchange", value: stock.exchange, })
    return await runAiTask(SystemPrompt, JSON.stringify(infos), z.array(z.object({
        keyword: z.string(),
        weight: z.number().min(0).max(1),
    })));
}

async function saveStockKeywords(stock: { symbol: string, exchange: string }, keywords: { keyword: string, weight: number }[]) {
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
        await tx.insert(tStockKeyword).values(values).onConflictDoUpdate({
            target: [tStockKeyword.stock_id, tStockKeyword.keyword],
            set: {
                weight: sql`EXCLUDED.weight`,
                updated_at: sql`NOW()`,
            }
        });
    })
}

export async function batchUpdateStockKeywords(num: number = 10) {
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
        .limit(num)
    for (const stock of stocks) {
        AiTaskQueue.add(async () => {
            const keywords = await generateStockKeywords(stock)
            await saveStockKeywords(stock, keywords)
        });
    }
}