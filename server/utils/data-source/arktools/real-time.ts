type DynamicData = {
    // 市场信息
    symbol: string; // 股票代码
    exchange: string; // 交易所
    price: number; // 当前价格
    open: number; // 开盘价
    high: number; // 最高价
    low: number; // 最低价
    change: number; // 涨跌额
    change_percent: number; // 涨跌幅
    volume: number; // 成交量
    turnover: number; // 成交额
    market_data_time: Date; // 数据时间戳
};

const AKTOOLS_URL = process.env.AKTOOLS_URL;

/**
 * 根据指定日期的 Date 对象和北京时间字符串生成 Date 对象
 * @param {Date} baseDate 基础日期（只取年月日）
 * @param {string} timeStr "HH:mm:ss"
 * @returns {Date} 对应北京时间的 Date 对象
 */
function buildBeijingDateUTC(baseDate: Date, timeStr: string): Date {
    const [h, m, s] = timeStr.split(":").map(Number) as [number, number, number];
    // 创建一个新的 Date
    const result = new Date(baseDate);
    // 设置为北京时间：UTC = 北京时间 - 8
    result.setUTCHours(h - 8, m, s, 0);
    return result;
}

/**
 * 解析过去的北京时间，返回 Date 对象
 * 如果时间已过去，使用当天；如果还未到，使用昨天
 * @param {string} timeStr "HH:mm:ss"
 * @returns {Date}
 */
function parsePastBeijingTimeUTC(timeStr: string) {
    const now = new Date();
    // 当天的北京时间
    let result = buildBeijingDateUTC(now, timeStr);
    // 如果这个时间 > 当前时间，则说明时间还未到，用昨天
    if (result > now) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        result = buildBeijingDateUTC(yesterday, timeStr);
    }
    return result;
}

export async function crawlStockRealTimePrice(): Promise<Array<DynamicData>> {
    type AkStockPrice = {
        代码: string;
        名称: string;
        最新价: number;
        涨跌额: number;
        涨跌幅: number;
        买入: number;
        卖出: number;
        昨收: number;
        今开: number;
        最高: number;
        最低: number;
        成交量: number;
        成交额: number;
        时间戳: string;
    };
    const res = await $fetch<Array<AkStockPrice>>(`${AKTOOLS_URL}/api/public/stock_zh_a_spot`);
    return res.map((r) => {
        const exchange = r["代码"].slice(0, 2).toUpperCase();
        const symbol = r["代码"].slice(2).toUpperCase();
        return {
            symbol,
            exchange,
            price: r["最新价"], // 当前价格
            open: r["今开"], // 开盘价
            high: r["最高"], // 最高价
            low: r["最低"], // 最低价
            change: r["涨跌额"], // 涨跌额
            change_percent: r["涨跌幅"], // 涨跌幅
            volume: r["成交量"], // 成交量
            turnover: r["成交额"], // 成交额
            market_data_time: parsePastBeijingTimeUTC(r["时间戳"]), // 数据时间戳
        };
    });
}
