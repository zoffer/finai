import { pgTable, text, unique, timestamp, index, real } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { sqlTimestamps } from "./common";

export const tNews = pgTable("news", {
    id: text().primaryKey().default(sql`uuidv7()`),
    title: text().notNull(), // 新闻标题
    content: text().notNull(), // 新闻内容
    date: timestamp({ withTimezone: true }).notNull(), // 新闻发布日期
    ...sqlTimestamps,
}, (t) => [
    unique().on(t.title, t.date),
]);

export const tNewsEffect = pgTable("news_effect", {
    id: text().primaryKey().default(sql`uuidv7()`),
    news_id: text().notNull(), // 关联到financial_news表的外键
    keyword: text().notNull(), // 关键词
    effect: real().notNull().default(0), // 新闻对股票的影响值 -1 ~ 1
    confidence: real().notNull().default(0), // 分析置信度 0 ~ 1
    reason: text().notNull(), // 分析原因
    ...sqlTimestamps,
}, (t) => [
    unique().on(t.news_id, t.keyword),
    index().on(t.keyword)
]);
