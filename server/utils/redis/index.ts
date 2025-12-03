import { createClient } from "redis";

export const rd = await createClient({
    url: process.env.REDIS_URL,
}).on("error", (err) => console.error(err)).connect();
