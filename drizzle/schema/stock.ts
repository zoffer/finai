import { sqlTimestamps, customNanoid } from "./common";
import { pgTable, text, index, uniqueIndex, numeric, timestamp, integer, real } from "drizzle-orm/pg-core";

// 股票基本信息表
export const Stock = pgTable("stock", {
    id: text().primaryKey().$default(() => customNanoid(16)),
    symbol: text().notNull(), // 股票代码
    name: text().notNull(), // 股票名称
    exchange: text().notNull(), // 交易所
    industry: text().notNull().default(""), // 所属行业
    introduction: text().notNull().default(""), // 股票介绍
    ...sqlTimestamps,
}, (table) => [
    // 确保股票代码在同一交易所内唯一
    uniqueIndex().on(table.symbol, table.exchange),
    index().on(table.symbol),
    index().on(table.exchange),
    index().on(table.name),
]);

export const StockDynamicData = pgTable("stock_dynamic_data", {
    id: text().primaryKey().$default(() => customNanoid(16)),
    stock_id: text().notNull().unique(), // 关联到stock表的外键
    // 市场信息
    price: numeric({ mode: 'number' }).notNull(), // 当前价格
    open: numeric({ mode: 'number' }).notNull(), // 开盘价
    high: numeric({ mode: 'number' }).notNull(), // 最高价
    low: numeric({ mode: 'number' }).notNull(), // 最低价
    volume: numeric({ mode: 'number' }).notNull(), // 成交量
    turnover: numeric({ mode: 'number' }).notNull(), // 成交额
    market_data_time: timestamp({ withTimezone: true }).notNull(), // 数据时间戳
    // 网站信息
    visits_24h: integer().notNull().default(0), // 24小时访问量
    heat_score: real().notNull().default(0), // 热榜分数
    updated_at: sqlTimestamps.updated_at, // 最后更新时间
}, (table) => [
    // 添加索引以提高查询性能
]);


