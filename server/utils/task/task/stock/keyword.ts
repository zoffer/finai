import z from "zod";
import { generateStockKeywords } from "./utils/keyword";
import { eq, and, gt, sql, max } from "drizzle-orm";
import { useProducerConsumer } from "~~/server/utils/task/utils/producer-consumer";
import { MESSAGE_QUEUE_KEY } from "~~/server/utils/redis/keys";
import { tStock, tStockKeyword, tStockDynamicData } from "~~/drizzle/schema/stock";

const updateTimeCondition = gt(tStockKeyword.updated_at, sql`NOW() - INTERVAL '60 days'`);

export function createStockKeywordTaskUnit() {
    return useProducerConsumer({
        key: MESSAGE_QUEUE_KEY.STOCK_KEYWORD,
        groupName: "keyword",
        messageSchema: z.object({ id: z.string() }),
        async produce(num: number = 100) {
            return db
                .select({ id: tStock.id })
                .from(tStock)
                .leftJoin(tStockKeyword, and(eq(tStock.id, tStockKeyword.stock_id), updateTimeCondition))
                .leftJoin(tStockDynamicData, eq(tStock.id, tStockDynamicData.stock_id))
                .groupBy(tStock.id)
                .having(eq(sql`count(${tStockKeyword.id})`, 0))
                .orderBy(sql`${max(tStockDynamicData.turnover)} DESC NULLS LAST`)
                .limit(num);
        },
        async consume(item, raw) {
            if (raw.deliveriesCounter && raw.deliveriesCounter > 10) {
                return;
            }
            const count = await db.$count(tStockKeyword, and(eq(tStockKeyword.stock_id, item.id), updateTimeCondition));
            if (count > 0) {
                return;
            }
            const [stock] = await db
                .select({ id: tStock.id, name: tStock.name, symbol: tStock.symbol, exchange: tStock.exchange })
                .from(tStock)
                .where(eq(tStock.id, item.id))
                .limit(1);
            if (stock == null) {
                return;
            }
            console.log(`Analyze Stock: ${stock.name}`);
            const keywords = await generateStockKeywords(stock);
            await db.transaction(async (tx) => {
                const values = keywords.map((item) => ({
                    stock_id: stock.id,
                    keyword: item.keyword,
                    weight: item.weight,
                }));
                await tx.delete(tStockKeyword).where(eq(tStockKeyword.stock_id, stock.id));
                await tx
                    .insert(tStockKeyword)
                    .values(values)
                    .onConflictDoUpdate({
                        target: [tStockKeyword.stock_id, tStockKeyword.keyword],
                        set: {
                            weight: sql`EXCLUDED.weight`,
                            updated_at: sql`NOW()`,
                        },
                    });
            });
        },
    });
}
