import { timestamp } from "drizzle-orm/pg-core";
import { customAlphabet } from "nanoid";

export const sqlTimestamps = {
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
};

export const customNanoid = customAlphabet("0123456789bcdfghjklmnpqrstvwxyz", 16);
