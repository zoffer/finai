import { sqlTimestamps, customNanoid } from "./common";
import { pgTable, text, index, uniqueIndex, numeric, timestamp } from "drizzle-orm/pg-core";

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

// 实时股票信息表
export const StockPrice = pgTable("stock_price", {
    id: text().primaryKey().$default(() => customNanoid(16)),
    stock_id: text().notNull(), // 关联到stock表的外键
    price: numeric({ mode: 'number' }).notNull(), // 当前价格
    open: numeric({ mode: 'number' }).notNull(), // 开盘价
    high: numeric({ mode: 'number' }).notNull(), // 最高价
    low: numeric({ mode: 'number' }).notNull(), // 最低价
    volume: numeric({ mode: 'number' }).notNull(), // 成交量
    data_time: timestamp({ withTimezone: true }).notNull(), // 数据时间戳
    updated_at: sqlTimestamps.updated_at, // 最后更新时间
}, (table) => [
    // 添加索引以提高查询性能
    uniqueIndex().on(table.stock_id),
]);


