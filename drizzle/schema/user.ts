import { sqlTimestamps, customNanoid } from "./common";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";

// 股票基本信息表
export const tUser = pgTable("user", {
    id: varchar({ length: 16 })
        .primaryKey()
        .$default(() => customNanoid(16)),
    nickname: text().notNull().unique(), // 用户昵称
    email: text().notNull().unique(), // 邮箱
    ...sqlTimestamps,
});
