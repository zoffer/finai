import { sql } from "drizzle-orm";
import { Stock } from "~~/drizzle/schema/schemas";
const NUXT_AKTOOLS_URL = process.env.AKTOOLS_URL;

type StockInfo = {
    symbol: string;
    name: string;
    exchange: string;
    industry: string;
}

async function saveStockInfo(items: Array<StockInfo>) {
    for (const item of items) {
        try {
            await db.insert(Stock).values(item).onConflictDoUpdate({
                target: [Stock.symbol, Stock.exchange],
                set: {
                    name: item.name,
                    industry: item.industry,
                    updated_at: sql`now()`
                },
            })
        } catch (error) {
            console.error(error);
        }
    }
}

export async function crawlStockInfoSH() {
    console.log("开始更新上交所股票信息");
    type AkStockInfo = {
        "证券代码": string;
        "证券简称": string;
        "公司全称": string;
        "上市日期": string;
    }
    const res = await $fetch<Array<AkStockInfo>>(`${NUXT_AKTOOLS_URL}/api/public/stock_info_sh_name_code`)
    const data = res.map((r) => ({
        symbol: r["证券代码"],
        name: r["证券简称"],
        exchange: "SH",
        industry: "",
    }))
    await saveStockInfo(data);
    console.log("上交所股票信息更新完成");
}


export async function crawlStockInfoSZ() {
    console.log("开始更新深证证券交易所股票信息");
    type AkStockInfo = {
        "板块": string;
        "A股代码": string;
        "A股简称": string;
        "A股上市日期": string;
        "A股总股本": string;
        "A股流通股本": string;
        "所属行业": string;
    }
    const res = await $fetch<Array<AkStockInfo>>(`${NUXT_AKTOOLS_URL}/api/public/stock_info_sz_name_code`)
    const data = res.map((r) => ({
        symbol: r["A股代码"],
        name: r["A股简称"],
        exchange: "SZ",
        industry: r["所属行业"],
    }))
    await saveStockInfo(data);
    console.log("深证证券交易所股票信息更新完成");
}


export async function crawlStockInfoBJ() {
    console.log("开始更新北京证券交易所股票信息");
    type AkStockInfo = {
        "证券代码": string;
        "证券简称": string;
        "总股本": number;
        "流通股本": number;
        "上市日期": string;
        "所属行业": string;
        "地区": string;
        "报告日期": string;
    }
    const res = await $fetch<Array<AkStockInfo>>(`${NUXT_AKTOOLS_URL}/api/public/stock_info_bj_name_code`)
    const data = res.map((r) => ({
        symbol: r["证券代码"],
        name: r["证券简称"],
        exchange: "BJ",
        industry: r["所属行业"],
    }))
    await saveStockInfo(data);
    console.log("北京证券交易所股票信息更新完成");
}
