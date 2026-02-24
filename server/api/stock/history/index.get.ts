// API接口：获取股票详情
import { eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { getRequestURL } from "h3";
import { tStock } from "~~/drizzle/schema/stock";
import z from "zod";
import { crawlStockHistory } from "~~/server/utils/data-source/aktools/hist";
import { apiCache } from "~~/server/utils/cache";

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
    }),
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
            code: "stock_not_found",
            message: "未找到指定股票",
        }).setHttpStatus(HTTP_STATUS.NOT_FOUND);
    }
    try {
        const data = await getHistory(stock, getRequestURL(event).toString());
        return { data };
    } catch (error) {
        return new ApiError({
            code: "stock_history_fetch_failed",
            message: "获取股票历史数据失败",
        }).setHttpStatus(HTTP_STATUS.SERVER_ERROR);
    }
});

async function getHistory(stock: { id: string; symbol: string }, cacheUrl: string) {
    // 10分钟过期时间（毫秒）
    const CACHE_EXPIRY = 10 * 60 * 1000;
    let cachedData: z.infer<typeof zData> | null = null;
    // 尝试获取缓存
    try {
        const cached = await apiCache.get(cacheUrl);

        // 检查缓存是否在10分钟内
        if (cached) {
            const res = zData.safeParse(cached.data);
            if (res.success) {
                cachedData = res.data;
                const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
                if (cacheAge < CACHE_EXPIRY) {
                    // 10分钟内的缓存直接使用
                    return res.data;
                }
            }
        }
    } catch (error) {
        console.error("获取缓存数据错误", error);
        // 缓存获取失败，继续执行后续流程
    }

    // 缓存过期或获取失败，尝试爬取新数据
    try {
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

        // 更新缓存（失败不影响返回结果）
        try {
            await apiCache.set(cacheUrl, data);
        } catch (cacheError) {
            console.error("更新缓存失败", cacheError);
        }

        return data;
    } catch (crawlError) {
        console.error("爬取股票历史数据失败", crawlError);

        // 爬取失败，返回缓存数据兜底
        if (cachedData) {
            return cachedData;
        }

        // 没有缓存且爬取失败，抛出错误
        throw new Error("无法获取股票历史数据");
    }
}
