import { pgTable, text, unique, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { sqlTimestamps } from "./common";

type AnalysisItem = {
    "keyword": string,
    "effect": number,
    "confidence": number,
    "reason": string,
}

export const tNews = pgTable("news", {
    id: text().primaryKey().default(sql`uuidv7()`),
    title: text().notNull(), // 新闻标题
    content: text().notNull(), // 新闻内容
    date: timestamp({ withTimezone: true }).notNull(), // 新闻发布日期
    analysis: jsonb().$type<AnalysisItem[]>(), // 新闻分析
    ...sqlTimestamps,
}, (t) => [
    unique().on(t.title, t.date),
]);

export const tNewsEffect = pgTable("news_effect", {
    id: text().primaryKey().default(sql`uuidv7()`),
    stock_id: text().notNull(), // 关联到stock表的外键
    news_id: text().notNull(), // 关联到financial_news表的外键
    analysis: jsonb().notNull().default([]).$type<AnalysisItem[]>(), // 新闻影响分析
    effect: real().notNull().default(0), // 新闻对股票的影响值 -1 ~ 1
    ...sqlTimestamps,
}, (t) => [
    unique().on(t.stock_id, t.news_id),
]);