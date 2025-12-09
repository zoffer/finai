import { createClient } from "redis";

export const rd = createClient({
    url: process.env.REDIS_URL,
});

rd.on("error", (err) => console.error(err))
    .connect()
    .then(() => rd.ping())
    .then((res) => console.log("Redis ping:", res));

class KvNews {
    #key(id: string) {
        return `news:analysis:lock:${id}`;
    }
    async lock(id: string, ex: number = 60 * 5) {
        const res = await rd.SET(this.#key(id), "1", {
            condition: 'NX',
            expiration: { type: "EX", value: ex }
        });
        return res === "OK";
    }
}

class KvAi {
    async log(model: string, id: string, data: Record<string, string>, ex: number = 60 * 10) {
        const key = `ai:log:${model}:${id}`;
        await rd.MULTI()
            .HSET(key, data)
            .EXPIRE(key, ex)
            .EXEC();
    }
}

export const kv = Object.freeze({
    ai: new KvAi(),
    news: new KvNews(),
});