import { sqlTimestamps } from "./common";
import { pgTable, text, json } from "drizzle-orm/pg-core";

// API缓存表
export const tApiCache = pgTable("api_cache", {
    url: text().notNull().unique(), // API URL
    data: json().notNull(), // API 缓存数据
    ...sqlTimestamps,
});
