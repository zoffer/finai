import { RedisMessageQueue, RedisMessageQueueGroup, RedisMessageQueueConsumer } from "~~/server/utils/redis/message-queue";
import z from "zod";

type Options<T extends Record<string, string>, ARG extends any[]> = {
    key: string;
    groupName: string;
    messageSchema: z.Schema<T>;
    produce: (...arg: ARG) => Promise<T[]>;
    consume: (item: T) => Promise<void>;
    consumerName?: string;
    maxQueueLength?: number;
};

export function useProducerConsumer<T extends Record<string, string>, ARG extends any[]>(options: Options<T, ARG>) {
    const { consumerName = "worker", maxQueueLength = 1024, groupName } = options;
    const mq = new RedisMessageQueue<T>(rd, options.key);
    const group = new RedisMessageQueueGroup<T>(mq, groupName);
    const consumer = new RedisMessageQueueConsumer<T>(group, consumerName);
    const produce = async (...arg: ARG) => {
        const len = await mq.len();
        if (len >= maxQueueLength) {
            return Promise.reject(new Error("queue is full"));
        }
        const items = await options.produce(...arg);
        const tasks = z
            .array(options.messageSchema)
            .parse(items)
            .map((item) => mq.add(item));
        await Promise.all(tasks);
    };
    const consume = async (
        readOptions: Parameters<(typeof consumer)["read"]>[0] = { COUNT: 1, BLOCK: 10 * 1000, CLAIM: 10 * 60 * 1000 }
    ) => {
        const messages = await consumer.read(readOptions);
        for await (const message of messages) {
            const parseResult = options.messageSchema.safeParse(message.message);
            if (!parseResult.success) {
                console.error(parseResult.error);
                await group.ackdel(message.id);
                return;
            }
            const item = parseResult.data;
            await options.consume(item);
            await group.ackdel(message.id);
        }
    };
    return { produce, consume, loop: createLoop(consume) };
}

function createLoop(func: () => Promise<void>) {
    let isRunning = false;
    return {
        start() {
            if (isRunning) {
                return;
            }
            isRunning = true;
            Promise.resolve().then(async () => {
                while (isRunning) {
                    try {
                        await func();
                    } catch (error) {
                        console.error(error);
                    }
                }
            });
        },
        stop() {
            isRunning = false;
        },
    };
}
