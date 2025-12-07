const NUXT_AKTOOLS_URL = process.env.AKTOOLS_URL;
import { Stock } from "~~/drizzle/schema/stock";
import { eq, and, sql } from "drizzle-orm";

type Data = {
    item: string;
    value: string | number;
} | {
    item: "affiliate_industry",
    value: { ind_code: string; ind_name: string; };
}

export async function crawlXQStockInfo(stock: { symbol: string, exchange: string }) {
    const code = stock.exchange + stock.symbol
    const res = await $fetch<Array<Data>>(`${NUXT_AKTOOLS_URL}/api/public/stock_individual_basic_info_xq`, {
        query: { symbol: code }
    })
    for (const item of res) {
        if (item.item === "org_cn_introduction") {
            const introduction = item.value as string;
            await db.update(Stock)
                .set({ introduction, updated_at: sql`NOW()` })
                .where(and(eq(Stock.symbol, stock.symbol), eq(Stock.exchange, stock.exchange)));
            break
        }
    }
    return res;
}
