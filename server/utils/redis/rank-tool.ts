class RankTool {
    readonly #name: string;
    readonly #period: number;
    constructor(name: string, period: number) {
        this.#name = name;
        this.#period = period;
    }
    #key(id: string) {
        return `stock:visit:count:${this.#name}:${id}`;
    }
    get #rankKey() {
        return `stock:visit:rank:${this.#name}`;
    }
    async incr(id: string) {
        const key = this.#key(id);
        await rd.MULTI().XADD(key, `*`, { u: "1" }).EXPIRE(key, Math.ceil(this.#period / 1000)).EXEC();
    }
    async count(id: string) {
        const key = this.#key(id);
        const [_, len] = await Promise.all([
            rd.XTRIM(key, "MINID", Date.now() - this.#period, { strategyModifier: "~" }),
            rd.XLEN(key),
        ]);
        return len
    }
    async rerank() {
        const list: { value: string, score: number }[] = [];
        for await (const keys of rd.scanIterator({ MATCH: this.#key("*") })) {
            await Promise.all(keys.map(async (key) => {
                const id = key.split(":").pop()!;
                const count = await this.count(id);
                if (count > 0) {
                    list.push({ value: id, score: count });
                }
            }))
        }
        if (list.length > 0) {
            await rd.MULTI().DEL(this.#rankKey).ZADD(this.#rankKey, list).EXEC();
        }
    }
    async range(start: number, end: number) {
        return await rd.ZRANGE_WITHSCORES(this.#rankKey, start, end, {
            REV: true,
        });
    }
}

export const StockRankTool = Object.freeze({
    v24h: new RankTool("24h", 24 * 60 * 60 * 1000),
})