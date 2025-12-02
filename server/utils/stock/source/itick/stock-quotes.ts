import { ITICK_TOKEN } from "./common";

type ApiData = {
    "code": number,
    "msg": string,
    "data": Record<string, {
        s: string; // symbol标的代码
        ld: number;// 最新价
        o: number; // 开盘价
        h: number; // 最高价
        l: number; // 最低价
        t: number; // 最新成交的时间戳，单位毫秒
        v: number; // 成交数量
        tu: number; // 成交额
        ts: number; // 标的交易状态
    }>
}

export async function fetchStockQuotes(region: string, codes: Array<string>) {
    // https://docs.itick.org/rest-api/stocks/stock-quotes
    const res = await $fetch<ApiData>("https://api.itick.org/stock/quotes", {
        query: { region, codes: codes.join(",") },
        headers: { Token: ITICK_TOKEN, }
    })
    if (res.code !== 0) {
        return Promise.reject(res.msg);
    }
    return Object.values(res.data).map((d) => ({
        symbol: d.s,
        exchange: region,
        price: d.ld,
        open: d.o,
        high: d.h,
        low: d.l,
        volume: d.v,
        data_time: new Date(d.t),
    }))
}
