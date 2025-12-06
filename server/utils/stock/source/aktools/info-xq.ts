const NUXT_AKTOOLS_URL = process.env.AKTOOLS_URL;

type Data = {
    item: string;
    value: string | number;
} | {
    item: "affiliate_industry",
    value: { ind_code: string; ind_name: string; };
}

export async function crawlXQStockInfo(exSymbol: string) {
    const res = await $fetch<Array<Data>>(`${NUXT_AKTOOLS_URL}/api/public/stock_individual_basic_info_xq`, {
        query: { symbol: exSymbol }
    })
    return res;
}
