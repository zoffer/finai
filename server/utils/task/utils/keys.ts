export enum MESSAGE_QUEUE_KEY {
    PREFIX = "MQ:stream",
    NEWS_KEYWORD = `${PREFIX}:news:keyword`,
    STOCK_KEYWORD = `${PREFIX}:stock:keyword`,
    NEWS_EMBEDDING = `${PREFIX}:news:embedding`,
}
