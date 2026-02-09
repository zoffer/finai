import type { H3Event } from "h3";
import z from "zod";
import { apiParameterParse } from "~~/server/utils/zod/parse";
import { rd } from "~~/server/utils/redis";
import { REDIS_KEYS } from "~~/server/utils/redis/keys";
import { ApiError } from "~~/server/utils/api";
import { db } from "~~/server/utils/db";
import { tUser } from "~~/drizzle/schema/user";
import { eq } from "drizzle-orm";
import { sign } from "~~/server/utils/auth/jwt";
import { AUTH_KEY } from "~~/server/utils/auth/keys";
import { customNanoid } from "~~/drizzle/schema/common";
import { AUTH_LOCK, LOCK_LOGIN_DURATION_HOURS, MAX_LOGIN_ATTEMPTS } from "~~/server/utils/auth/lock";

const EXPIRES_DAY = 3;

const zParameter = z.object({
    email: z.email("邮箱格式不正确").trim(),
    code: z.string().length(6, "验证码必须为6位数字"),
});

async function verifyCode(email: string, code: string): Promise<boolean> {
    const key = REDIS_KEYS.verification.code(email);
    const storedCode = await rd.get(key);

    if (!storedCode) {
        return false;
    }

    const isValid = storedCode === code;

    if (isValid) {
        await rd.del(key);
    }

    return isValid;
}

async function findOrCreateUser(email: string) {
    const users = await db.select().from(tUser).where(eq(tUser.email, email)).limit(1);

    if (users.length > 0) {
        return users[0]!;
    }

    const emailName = email.split("@")[0]!;
    let nickname = emailName;

    while (true) {
        const existingUsers = await db.select({ id: tUser.id }).from(tUser).where(eq(tUser.nickname, nickname)).limit(1);
        if (existingUsers.length === 0) {
            break;
        }
        nickname = `${emailName}_${customNanoid(4)}`;
    }

    const newUsers = await db.insert(tUser).values({ nickname, email }).returning();

    return newUsers[0]!;
}

export default defineApiEventHandler(async (event: H3Event<{ body: z.input<typeof zParameter> }>) => {
    const body = await apiParameterParse(zParameter, await readBody(event));

    const isLocked = await AUTH_LOCK.isLoginLocked(body.email);
    if (isLocked) {
        return new ApiError({
            code: "account_locked",
            message: `账户已被锁定，请${LOCK_LOGIN_DURATION_HOURS}小时后重试`,
        });
    }

    const isValid = await verifyCode(body.email, body.code);
    if (!isValid) {
        const failCount = await AUTH_LOCK.incrLoginFailedAttempt(body.email);
        const remainingAttempts = MAX_LOGIN_ATTEMPTS - failCount;

        if (failCount >= MAX_LOGIN_ATTEMPTS) {
            return new ApiError({
                code: "account_locked",
                message: `验证码错误次数过多，账户已被锁定，请${LOCK_LOGIN_DURATION_HOURS}小时后重试`,
            });
        }

        return new ApiError({
            code: "invalid_code",
            message: `验证码错误或已过期，剩余尝试次数：${remainingAttempts}`,
        });
    }

    const user = await findOrCreateUser(body.email);

    const token = await sign({ id: user.id }, `${EXPIRES_DAY}d`);

    setCookie(event, AUTH_KEY, token, {
        httpOnly: true,
        secure: !import.meta.dev,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * EXPIRES_DAY,
    });

    return {
        message: "登录成功",
        data: { token },
    };
});
