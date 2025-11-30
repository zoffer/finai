import { drizzle } from "drizzle-orm/node-postgres";

// 初始化 Drizzle ORM
export const db = drizzle(process.env.DATABASE_URL!, { logger: import.meta.dev });