import { sqlTimestamps, customNanoid } from "./common";
import { pgTable, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// 股票基本信息表
export const tUser = pgTable("user", {
    id: text()
        .primaryKey()
        .$default(() => customNanoid(16)),
    nickname: text().notNull(), // 用户昵称
    email: text().notNull().unique(), // 邮箱
    ...sqlTimestamps,
});
