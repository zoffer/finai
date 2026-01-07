type RedisClientType = typeof rd;

export class RedisMessageQueue<T extends Record<string, string>> {
    readonly streamKey: string;
    readonly client: RedisClientType;
    constructor(client: RedisClientType, name: string) {
        this.client = client;
        this.streamKey = `stream:queue:${name}`;
    }
    len() {
        return this.client.XLEN(this.streamKey);
    }
    add(data: T) {
        return this.client.XADD(this.streamKey, "*", data);
    }
    createConsumer(groupName: string, consumerName: string) {
        return new RedisMessageQueueConsumer(this.client, this.streamKey, groupName, consumerName);
    }
}

class RedisMessageQueueConsumer {
    readonly streamKey: string;
    readonly client: RedisClientType;
    readonly groupName: string;
    readonly consumerName: string;
    constructor(client: RedisClientType, streamKey: string, groupName: string, consumerName: string) {
        this.client = client;
        this.streamKey = streamKey;
        this.groupName = groupName;
        this.consumerName = consumerName;
    }
    ack(messageId: string) {
        return this.client.XACKDEL(this.streamKey, this.groupName, messageId, "ACKED");
    }
    async *read(options: Parameters<RedisClientType["XREADGROUP"]>[3] = { COUNT: 1, BLOCK: 0, CLAIM: 10 * 60 * 1000 }) {
        // https://github.com/redis/node-redis/blob/master/docs/pub-sub.md
        const client = this.client.duplicate();
        await client.connect();
        try {
            await client.XGROUP_CREATE(this.streamKey, this.groupName, "0", { MKSTREAM: true });
        } catch (error) {
            if (error instanceof Error && error.message.includes("BUSYGROUP")) {
                // 组已存在
            } else {
                throw error;
            }
        }
        while (true) {
            // https://redis.io/docs/latest/commands/xreadgroup/
            const res = await client.XREADGROUP(this.groupName, this.consumerName, { key: this.streamKey, id: ">" }, options);
            if (!res || res[0].messages.length === 0) {
                continue;
            }
            yield* res[0].messages;
        }
    }
}
