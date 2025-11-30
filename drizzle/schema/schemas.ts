import { sqlTimestamps, customNanoid } from "./common";
import { pgTable, text, index, uniqueIndex } from "drizzle-orm/pg-core";

const nanoid = customNanoid(8);
// 股票基本信息表
export const Stock = pgTable("stock", {
    id: text().primaryKey().$default(() => nanoid()),
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


