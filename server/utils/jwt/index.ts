import * as jose from "jose";
import type { CryptoKey, JWTPayload } from "jose";
import { nanoid } from "nanoid";
import { rd } from "~~/server/utils/redis";
import { REDIS_KEYS } from "~~/server/utils/redis/keys";

// --- 配置参数 ---
const KEY_ALGO = "RS256";
const ROTATION_INTERVAL_HOURS = 24;
export const TOKEN_EXPIRY_HOURS = 3 * 24;
const REDIS_PUBLIC_KEY_TTL = 3600 * (ROTATION_INTERVAL_HOURS + TOKEN_EXPIRY_HOURS);

class LimitSizeMap<K, V> extends Map<K, V> {
    private limit: number;
    constructor(limit: number) {
        super();
        this.limit = limit;
    }
    set(key: K, value: V) {
        super.set(key, value);
        while (this.size > this.limit) {
            this.delete(this.keys().next().value!);
        }
        return this;
    }
}

class JWTManager {
    private kid: string = "";
    private privateKey: CryptoKey | null = null;
    private publicKeyCache = new LimitSizeMap<string, CryptoKey>(128);

    async rotateKeys() {
        console.log("🔄 正在轮转密钥...");
        const { publicKey, privateKey } = await jose.generateKeyPair(KEY_ALGO);
        const kid = nanoid(16);
        const jwk = await jose.exportJWK(publicKey);

        await rd.set(REDIS_KEYS.auth.jwt(kid), JSON.stringify(jwk), { EX: REDIS_PUBLIC_KEY_TTL });

        this.kid = kid;
        this.privateKey = privateKey;
        this.publicKeyCache.set(kid, publicKey);

        console.log(`✅ 新密钥已启用: kid=${kid}`);
    }

    async signToken(payload: { id: string } & JWTPayload) {
        if (this.privateKey == null) {
            await this.rotateKeys();
        }

        return await new jose.SignJWT(payload)
            .setProtectedHeader({ alg: KEY_ALGO, kid: this.kid })
            .setExpirationTime(`${TOKEN_EXPIRY_HOURS}h`)
            .sign(this.privateKey!);
    }

    async verifyToken(token: string) {
        const header = jose.decodeProtectedHeader(token);
        const { kid } = header;

        if (!kid) throw new Error("Token 缺少 kid");

        // 获取公钥 (本地缓存 -> Redis)
        let publicKey = this.publicKeyCache.get(kid);

        if (!publicKey) {
            const jwkString = await rd.get(REDIS_KEYS.auth.jwt(kid));
            if (!jwkString) throw new Error("密钥已失效或不存在");

            publicKey = (await jose.importJWK(JSON.parse(jwkString), KEY_ALGO)) as CryptoKey;
            this.publicKeyCache.set(kid, publicKey);
        }

        // 验证签名
        const { payload } = await jose.jwtVerify(token, publicKey);
        return payload;
    }
}

export const JWT_MANAGER = new JWTManager();
