export const REDIS_KEYS = Object.freeze({
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
