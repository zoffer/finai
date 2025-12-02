const ITICK_TOKEN = process.env.ITICK_TOKEN as string;

type ApiData = {
    "code": number,
    "msg": string,
    "data": Array<{
        "c": string, // 产品代码
        "n": string, // 产品名称
        "t": string, // 类型 如 stock | forex | indices | crypto | future | fund
        "e": string, // 交易所代码
        "s": string, // 产品所属行业
        "l": string, // 产品英文名称
    }>
}

export async function fetchSymbolList(exchange: "SH" | "SZ" | "HK") {
    // https://docs.itick.org/rest-api/basics/symbol-list
    const res = await $fetch<ApiData>("https://api.itick.org/symbol/list", {
        query: {
            type: "stock",
            region: exchange,
        },
        headers: {
            Token: ITICK_TOKEN,
        }
    })
    if (res.code !== 0) {
        console.error("itick symbol list error", res);
        return Promise.reject(res.msg);
    }
    return res.data.map((d) => ({
        symbol: d.c,
        name: d.n,
        exchange: exchange,
        industry: d.s,
    }))
}
