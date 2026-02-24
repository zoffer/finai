import { db } from "../db";
import { tApiCache } from "../../../drizzle/schema/cache";
import { eq, sql } from "drizzle-orm";

type ApiCache<T = unknown> = {
    url: string;
    data: T;
    created_at: Date;
    updated_at: Date;
};

class ApiCacheTool {
    /**
     * 获取缓存数据
     * @param url API URL
     * @returns 完整的缓存数据或null
     */
    async get<T = unknown>(url: string): Promise<ApiCache<T> | null> {
        try {
            const result = await db.select().from(tApiCache).where(eq(tApiCache.url, url)).limit(1);
            return result[0] as ApiCache<T> | null;
        } catch (error) {
            console.error("获取缓存失败:", error);
            return null;
        }
    }

    /**
     * 设置缓存数据
     * @param url API URL
     * @param data 缓存数据
     * @returns 是否设置成功
     */
    async set<T>(url: string, data: T): Promise<boolean> {
        try {
            await db
                .insert(tApiCache)
                .values({ url, data })
                .onConflictDoUpdate({
                    target: tApiCache.url,
                    set: {
                        data: sql`EXCLUDED.data`,
                        updated_at: sql`NOW()`,
                    },
                });

            return true;
        } catch (error) {
            console.error("设置缓存失败:", error);
            return false;
        }
    }

    /**
     * 清除缓存
     * @param url API URL
     * @returns 是否清除成功
     */
    async delete(url: string): Promise<boolean> {
        try {
            const result = await db.delete(tApiCache).where(eq(tApiCache.url, url)).returning();

            return result.length > 0;
        } catch (error) {
            console.error("清除缓存失败:", error);
            return false;
        }
    }
}

export const apiCache = new ApiCacheTool();
