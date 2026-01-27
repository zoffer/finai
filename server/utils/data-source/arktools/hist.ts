const NUXT_AKTOOLS_URL = process.env.AKTOOLS_URL;

type Data = {
    日期: string; //"2025-12-17T00:00:00.000",
    股票代码: string;
    开盘: number;
    收盘: number;
    最高: number;
    最低: number;
    成交量: number;
    成交额: number;
    振幅: number;
    涨跌幅: number;
    涨跌额: number;
    换手率: number;
};

const formatDateToYYYYMMdd = (date: Date) => {
    const [y, m, d] = [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((num) => num.toString().padStart(2, "0"));
    return `${y}${m}${d}`;
};

export async function crawlStockHistory(q: {
    symbol: string;
    period: "daily" | "weekly" | "monthly";
    start_date?: Date;
    adjust?: "qfq" | "hfq";
}) {
    const query: Record<string, string> = {
        symbol: q.symbol,
        period: q.period,
    };
    if (q.start_date) {
        query.start_date = formatDateToYYYYMMdd(q.start_date);
    }
    if (q.adjust) {
        query.adjust = q.adjust;
    }
    const res = await $fetch<Array<Data>>(`${NUXT_AKTOOLS_URL}/api/public/stock_zh_a_hist`, { query });
    return res.map((item) => ({
        date: item.日期,
        open: item.开盘,
        close: item.收盘,
        high: item.最高,
        low: item.最低,
        volume: item.成交量,
        turnover: item.成交额,
        amplitude: item.振幅,
        change: item.涨跌幅,
        change_amount: item.涨跌额,
        turnover_rate: item.换手率,
    }));
}
