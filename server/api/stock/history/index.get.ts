// API接口：获取股票详情
import { eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { tStock } from "~~/drizzle/schema/stock";
import z from "zod";
import { crawlStockHistory } from "~~/server/utils/data-source/arktools/hist";
import { rd } from "~~/server/utils/redis";
import { REDIS_KEYS } from "~~/server/utils/redis/keys";

const zParameter = z.object({
    id: z.string().trim(),
});

const zData = z.array(
    z.object({
        time: z.string(),
        open: z.number(),
        close: z.number(),
        high: z.number(),
        low: z.number(),
        volume: z.number(),
        turnover: z.number(),
        amplitude: z.number(),
        change: z.number(),
        change_amount: z.number(),
        turnover_rate: z.number(),
    })
);

export default defineApiEventHandler(async (event: H3Event<{ query: z.input<typeof zParameter> }>) => {
    // 获取股票代码参数
    const query = await apiParameterParse(zParameter, getQuery(event));

    const [stock] = await db
        .select({
            id: tStock.id,
            symbol: tStock.symbol,
            exchange: tStock.exchange,
            name: tStock.name,
        })
        .from(tStock)
        .where(eq(tStock.id, query.id))
        .limit(1);
    if (!stock) {
        return new ApiError({
            code: "STOCK_NOT_FOUND",
            message: "未找到指定股票",
        }).setHttpStatus(HTTP_STATUS.NOT_FOUND);
    }
    const data = await getHistory(stock);

    return { data };
});

const CACHE_KEY = REDIS_KEYS.stock.historyCache;

async function getHistory(stock: { id: string; symbol: string }) {
    try {
        const cachedData = await getData(stock.id);
        if (cachedData) {
            return cachedData;
        }
    } catch (error) {
        console.error("获取缓存数据错误", error);
    }
    const res = await crawlStockHistory({
        symbol: stock.symbol,
        period: "daily",
        adjust: "qfq",
        start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    });
    const data = res.map((item) => ({
        time: item.date.slice(0, 10),
        ...item,
    }));
    cacheData(stock.id, data);
    return data;
}

async function getData(id: string) {
    const cachedData = await rd.HGET(CACHE_KEY, id);
    if (cachedData) {
        return zData.parse(JSON.parse(cachedData));
    }
}

async function cacheData(id: string, data: z.infer<typeof zData>) {
    await rd.HSETEX(
        CACHE_KEY,
        {
            [id]: JSON.stringify(data),
        },
        {
            expiration: {
                type: "EX",
                value: 60 * 60,
            },
        }
    );
}
