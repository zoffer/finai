import { rd } from "~~/server/utils/redis";
import { RedisMessageQueue } from "~~/server/utils/redis/message-queue";
import { crawlCLSNews } from "./cls-news";
import z from "zod";
import { analyzeNews } from "./keywork";
import { tNewsEffect } from "~~/drizzle/schema/news";
import { newsDbHelper as dbHelper } from "./db-helper";

const MAX_TASK = 1024;
const schema = z.object({ id: z.string() });
const MessageQueue = new RedisMessageQueue<z.infer<typeof schema>>(rd, "task:news");

export default class NewsTask {
    constructor() {
        setTimeout(() => this.startConsumeKeywork(), 1000);
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
    private async startConsumeKeywork() {
        const consumer = await MessageQueue.createConsumer("news", "worker");
        for await (const message of consumer.read()) {
            try {
                const parseResult = schema.safeParse(message.message);
                if (!parseResult.success) {
                    console.error(parseResult.error);
                    await consumer.ack(message.id);
                    continue;
                }
                const id = parseResult.data.id;
                const subitems = await dbHelper.getNewsSubitem(id, tNewsEffect);
                if (subitems.length > 0) {
                    await consumer.ack(message.id);
                    continue;
                }
                const news = await dbHelper.getNews(id);
                if (news === null) {
                    await consumer.ack(message.id);
                    continue;
                }
                console.log(`Analyze news: ${news.title}`);
                const effects = await analyzeNews(news);
                await dbHelper.saveKeywordEffect(news, effects);
                await consumer.ack(message.id);
            } catch (error) {
                console.error(error);
                continue;
            }
        }
    }
}
