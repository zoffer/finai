import { rd } from "~~/server/utils/redis";
import { RedisMessageQueue } from "~~/server/utils/redis/message-queue";
import { crawlCLSNews } from "~~/server/utils/data-source/arktools/cls-news";
import z from "zod";
import { analyzeNews } from "./keywork";
import { tNewsEffect } from "~~/drizzle/schema/news";
import { newsDbHelper as dbHelper } from "./db-helper";

const QUEUE_NAME = "task:news";
const GROUP = Object.freeze({
    KEYWORD: { name: "keyword", consumer: "worker" },
    EMBEDDING: { name: "embedding", consumer: "worker" },
});
const MAX_TASK = 1024;
const CLAIM_TIMEOUT = 10 * 60 * 1000;
const schema = z.object({ id: z.string() });
const MessageQueue = new RedisMessageQueue<z.infer<typeof schema>>(rd, QUEUE_NAME);

export class NewsTask {
    keywordReader: ReturnType<(typeof MessageQueue)["createReader"]>;
    constructor() {
        this.keywordReader = MessageQueue.createReader(GROUP.KEYWORD.name, GROUP.KEYWORD.consumer);
    }
    async produce() {
        const data = await crawlCLSNews();
        await dbHelper.save(data);
        if ((await MessageQueue.len()) > MAX_TASK) {
            return;
        }
        const unprocessed = await dbHelper.getUnprocessed();
        for (const item of unprocessed) {
            await MessageQueue.add({ id: item.id });
        }
    }
    async consumeKeyword() {
        const reader = this.keywordReader;
        const messages = await reader.read({ COUNT: 1, BLOCK: 0, CLAIM: CLAIM_TIMEOUT });
        for await (const message of messages) {
            const parseResult = schema.safeParse(message.message);
            if (!parseResult.success) {
                console.error(parseResult.error);
                await reader.ackdel(message.id);
                return;
            }
            const id = parseResult.data.id;
            const count = await dbHelper.countSubitem(id, tNewsEffect);
            if (count > 0) {
                await reader.ackdel(message.id);
                return;
            }
            const news = await dbHelper.getNews(id);
            if (news == null) {
                await reader.ackdel(message.id);
                continue;
            }
            console.log(`Analyze news: ${news.title}`);
            const effects = await analyzeNews(news);
            await dbHelper.saveKeywordEffect(news, effects);
            await reader.ackdel(message.id);
        }
    }
}
