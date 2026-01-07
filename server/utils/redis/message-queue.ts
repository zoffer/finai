import { initAsyncCompiler } from "sass";

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
    createReader(groupName: string, consumerName: string) {
        return new RedisMessageQueueReader(this.client, this.streamKey, groupName, consumerName);
    }
}

class RedisMessageQueueReader {
    readonly client: RedisClientType;
    readonly readerClient: RedisClientType;
    readonly streamKey: string;
    readonly groupName: string;
    readonly consumerName: string;
    constructor(client: RedisClientType, streamKey: string, groupName: string, consumerName: string) {
        this.client = client;
        this.readerClient = client.duplicate();
        this.streamKey = streamKey;
        this.groupName = groupName;
        this.consumerName = consumerName;
    }
    private async connect() {
        if (this.readerClient.isReady) {
            return;
        }
        await this.readerClient.connect();
        try {
            await this.client.XGROUP_CREATE(this.streamKey, this.groupName, "0", { MKSTREAM: true });
        } catch (error) {
            if (error instanceof Error && error.message.includes("BUSYGROUP")) {
                // 组已存在
                return;
            }
            return Promise.reject(error);
        }
    }
    ackdel(messageId: string, policy: Parameters<RedisClientType["XACKDEL"]>[3] = "ACKED") {
        return this.client.XACKDEL(this.streamKey, this.groupName, messageId, policy);
    }
    async read(options: Parameters<RedisClientType["XREADGROUP"]>[3] = { COUNT: 1, BLOCK: 0, CLAIM: 10 * 60 * 1000 }) {
        await this.connect();
        // https://redis.io/docs/latest/commands/xreadgroup/
        const res = await this.readerClient.XREADGROUP(
            this.groupName,
            this.consumerName,
            { key: this.streamKey, id: ">" },
            options
        );
        if (res == null) {
            return [];
        }
        return res[0].messages;
    }
}
