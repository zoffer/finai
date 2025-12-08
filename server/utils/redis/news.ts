class KvNews {
    constructor() {
    }
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

export const kvNews = new KvNews();