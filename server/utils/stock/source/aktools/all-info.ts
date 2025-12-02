const NUXT_AKTOOLS_URL = process.env.AKTOOLS_URL;
import type { StockData } from "~~/server/utils/stock/cache/index";

export async function crawlStockInfoSH(): Promise<Array<StockData>> {
    console.log("开始更新上交所股票信息");
    type AkStockInfo = {
        "证券代码": string;
        "证券简称": string;
        "公司全称": string;
        "上市日期": string;
    }
    const res = await $fetch<Array<AkStockInfo>>(`${NUXT_AKTOOLS_URL}/api/public/stock_info_sh_name_code`)
    return res.map((r) => ({
        symbol: r["证券代码"],
        name: r["证券简称"],
        exchange: "SH",
        industry: "",
    }))
}


export async function crawlStockInfoSZ(): Promise<Array<StockData>> {
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
    return res.map((r) => ({
        symbol: r["A股代码"],
        name: r["A股简称"],
        exchange: "SZ",
        industry: r["所属行业"],
    }))
}


export async function crawlStockInfoBJ(): Promise<Array<StockData>> {
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
    return res.map((r) => ({
        symbol: r["证券代码"],
        name: r["证券简称"],
        exchange: "BJ",
        industry: r["所属行业"],
    }))
}
