import { timestamp } from "drizzle-orm/pg-core";
import { customAlphabet } from "nanoid";

export const sqlTimestamps = {
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
};

export function customNanoid(len = 16) {
    return customAlphabet("6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz", len);
}
