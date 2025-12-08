import { pgTable, text } from "drizzle-orm/pg-core";
import { sqlTimestamps, customNanoid } from "./common";

export const tAiLog = pgTable("ai_log", {
    id: text().primaryKey().$default(() => customNanoid(16)),
    model: text().notNull().default(""),
    request_body: text().notNull().default(""),
    response_body: text().notNull().default(""),
    ...sqlTimestamps,
});