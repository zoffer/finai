import { streamText } from "ai";
import { z } from "zod";
import { crawlXQStockInfo } from "~~/server/utils/stock/source/aktools/info-xq";
import { createDeepSeek } from '@ai-sdk/deepseek';
import { StockKeyword, Stock, StockDynamicData } from '~~/drizzle/schema/stock';
import { sql, and, eq, max } from 'drizzle-orm';
import PQueue from 'p-queue';

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

class LogStream {
    private log = "";
    write(text: string) {
        this.log += text;
        const list = this.log.split("\n");
        if (list.length > 1) {
            for (let i = 0; i < list.length - 1; i++) {
                console.log(list[i]);
            }
            this.log = list[list.length - 1];
        }
    }
}

async function generateStockKeywords(stock: { symbol: string, exchange: string }) {
    console.log('Start processing stock keywords for', stock);
    const code = stock.exchange + stock.symbol;
    const infos = await crawlXQStockInfo(code);
    infos.push({ item: "symbol", value: stock.symbol, })
    infos.push({ item: "exchange", value: stock.exchange, })
    const { fullStream, text } = streamText({
        model: deepseek("deepseek-reasoner"),
        system: SystemPrompt,
        temperature: 0,
        prompt: JSON.stringify(infos),
    });
    const logStream = new LogStream();
    for await (const part of fullStream) {
        if (part.type === 'reasoning-delta') {
            logStream.write(part.text);
        } else if (part.type === 'text-delta') {
            logStream.write(part.text);
        }
    }

    const list = await z.array(z.object({
        keyword: z.string(),
        weight: z.number().min(0).max(1),
    })).parse(JSON.parse(await text));

    await db.transaction(async (tx) => {
        const stocks = await tx.select({ id: Stock.id })
            .from(Stock)
            .where(and(eq(Stock.symbol, stock.symbol), eq(Stock.exchange, stock.exchange)));
        if (stocks.length === 0) {
            throw new Error("Stock not found");
        }
        const id = stocks[0].id;
        await tx.insert(StockKeyword).values(list.map(item => ({
            stock_id: id,
            keyword: item.keyword,
            weight: item.weight,
        }))).onConflictDoUpdate({
            target: [StockKeyword.stock_id, StockKeyword.keyword],
            set: {
                weight: sql`EXCLUDED.weight`,
                updated_at: sql`NOW()`,
            }
        });
    })
}

export async function generateBatchStockKeywords(num: number = 10) {
    const queue = new PQueue({ concurrency: 1 });
    const stocks = await db
        .select({
            id: Stock.id,
            name: Stock.name,
            exchange: Stock.exchange,
            symbol: Stock.symbol,
        })
        .from(Stock)
        .leftJoin(StockKeyword, eq(Stock.id, StockKeyword.stock_id))
        .leftJoin(StockDynamicData, eq(Stock.id, StockDynamicData.stock_id))
        .groupBy(Stock.id)
        .orderBy(
            sql`${max(StockKeyword.updated_at)} ASC NULLS FIRST`,
            sql`${max(StockDynamicData.turnover)} DESC NULLS LAST`,
        )
        .limit(num)
    for (const stock of stocks) {
        queue.add(() => generateStockKeywords(stock));
    }
    await queue.onIdle();
}