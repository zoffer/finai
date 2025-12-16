import { timestamp } from "drizzle-orm/pg-core";
import { customAlphabet } from "nanoid";

export const sqlTimestamps = {
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
};

// https://www.crockford.com/base32.html
export const customNanoid = customAlphabet("0123456789ABCDEFGHJKMNPQRSTVWXYZ", 16);
