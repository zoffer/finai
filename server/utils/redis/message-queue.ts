type RedisClientType = typeof rd;

export class RedisMessageQueue<T extends Record<string, string>> {
    readonly key: string;
    readonly client: RedisClientType;
    constructor(client: RedisClientType, key: string) {
        this.client = client;
        this.key = key;
    }
    len() {
        return this.client.XLEN(this.key);
    }
    add(data: T) {
        return this.client.XADD(this.key, "*", data);
    }
}

export class RedisMessageQueueGroup<T extends Record<string, string>> {
    readonly stream: RedisMessageQueue<T>;
    readonly name: string;
    constructor(stream: RedisMessageQueue<T>, groupName: string) {
        this.stream = stream;
        this.name = groupName;
        Promise.resolve().then(() => this.init(), console.error);
    }
    get client() {
        return this.stream.client;
    }
    async init() {
        const client = this.client.duplicate();
        try {
            await client.connect();
            await client.XGROUP_CREATE(this.stream.key, this.name, "0", { MKSTREAM: true });
            client.destroy();
        } catch (error) {
            client.destroy();
            if (error instanceof Error && error.message.includes("BUSYGROUP")) {
                // 组已存在
                return;
            }
            return Promise.reject(error);
        }
    }
    ackdel(messageId: string, policy: Parameters<RedisClientType["XACKDEL"]>[3] = "ACKED") {
        return this.client.XACKDEL(this.stream.key, this.name, messageId, policy);
    }
}

export class RedisMessageQueueConsumer<T extends Record<string, string>> {
    readonly client: RedisClientType;
    readonly group: RedisMessageQueueGroup<T>;
    readonly name: string;
    constructor(group: RedisMessageQueueGroup<T>, consumerName: string) {
        this.client = group.client.duplicate();
        this.group = group;
        this.name = consumerName;
    }
    get stream() {
        return this.group.stream;
    }
    async read(options?: Parameters<RedisClientType["XREADGROUP"]>[3]) {
        if (!this.client.isReady) {
            await this.client.connect();
        }
        // https://redis.io/docs/latest/commands/xreadgroup/
        const res = await this.client.XREADGROUP(this.group.name, this.name, { key: this.stream.key, id: ">" }, options);
        if (res == null) {
            return [];
        }
        return res[0].messages;
    }
}
