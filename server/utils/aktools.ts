import { sql, max } from "drizzle-orm";
import { Stock } from "~~/drizzle/schema/schemas";
const NUXT_AKTOOLS_URL = process.env.AKTOOLS_URL;

type szStockInfo = {
    "板块": string;
    "A股代码": string;
    "A股简称": string;
    "A股上市日期": string;
    "A股总股本": string;
    "A股流通股本": string;
    "所属行业": string;
}

const crawlInterval = 1000 * 60 * 60;
let nextUpdateTime = 0;

async function crawlStockInfo() {
    if (Date.now() < nextUpdateTime) {
        return;
    }
    const lastUpdate = await db.select({
        value: max(Stock.updated_at)
    }).from(Stock)
    // 计算上次更新时间不足1小时则返回
    if (lastUpdate.length > 0 && lastUpdate[0].value instanceof Date) {
        nextUpdateTime = lastUpdate[0].value.getTime() + crawlInterval;
    }
    if (Date.now() < nextUpdateTime) {
        return;
    }
    // 深证证券交易所股票代码和简称
    await $fetch<Array<szStockInfo>>(`${NUXT_AKTOOLS_URL}/api/public/stock_info_sz_name_code`).then((res) => {
        for (const r of res) {
            const item = {
                symbol: r["A股代码"],
                name: r["A股简称"],
                exchange: "SZ",
                industry: r["所属行业"],
            }
            db.insert(Stock).values(item).onConflictDoUpdate({
                target: [Stock.symbol, Stock.exchange],
                set: {
                    name: item.name,
                    industry: item.industry,
                    updated_at: sql`now()`
                },
            }).catch(console.error)
        }
    }).catch(console.error)
    nextUpdateTime = Date.now() + crawlInterval;
}

export const AKTOOLS = Object.freeze({
    async list() {
        crawlStockInfo();
        return await db.select().from(Stock);
    }
});