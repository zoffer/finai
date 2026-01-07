// API接口：获取股票详情
import { eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { tStock } from "~~/drizzle/schema/stock";
import z from "zod";
import { crawlStockHistory } from "~~/server/utils/data-source/arktools/hist";

const zParameter = z.object({
    id: z.string().trim(),
});

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

    return { data };
});
