export const REDIS_KEYS = Object.freeze({
    verification: Object.freeze({
        code: (account: string) => `verification:code:${account}`,
        cooldown: (account: string) => `verification:cooldown:${account}`,
        failCount: (account: string) => `verification:fail:count:${account}`,
    }),
    stock: Object.freeze({
        historyCache: "stock:history:cache:H",
    }),
    news: Object.freeze({
        keywordDeliverRecord: "news:keyword:deliver:record:H",
    }),
});

export enum MESSAGE_QUEUE_KEY {
    PREFIX = "MQ:stream",
    NEWS_KEYWORD = `${PREFIX}:news:keyword`,
    STOCK_KEYWORD = `${PREFIX}:stock:keyword`,
    NEWS_EMBEDDING = `${PREFIX}:news:embedding`,
}
