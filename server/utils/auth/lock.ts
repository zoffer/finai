import { rd } from "~~/server/utils/redis";
import { REDIS_KEYS } from "~~/server/utils/redis/keys";

export const LOCK_LOGIN_DURATION_HOURS = 24;
export const MAX_LOGIN_ATTEMPTS = 10;

export const AUTH_LOCK = Object.freeze({
    async isLoginLocked(email: string): Promise<boolean> {
        const failCount = await this.getLoginFailedAttempts(email);
        return failCount >= MAX_LOGIN_ATTEMPTS;
    },

    async getLoginFailedAttempts(email: string): Promise<number> {
        const key = REDIS_KEYS.verification.failCount(email);
        const failCount = await rd.get(key);
        return failCount !== null ? parseInt(failCount) : 0;
    },

    async incrLoginFailedAttempt(email: string): Promise<number> {
        const key = REDIS_KEYS.verification.failCount(email);

        const [count] = await rd
            .multi()
            .incr(key)
            .expire(key, LOCK_LOGIN_DURATION_HOURS * 60 * 60, "NX")
            .exec<"typed">();

        return count;
    },
});
