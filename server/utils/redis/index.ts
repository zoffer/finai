import { createClient } from "redis";

export const rd = createClient({
    RESP: 2,
    url: process.env.REDIS_URL,
});

rd.on("error", (err) => console.error(err))
    .connect()
    .then(() => rd.ping())
    .then((res) => console.log("Redis ping:", res));
