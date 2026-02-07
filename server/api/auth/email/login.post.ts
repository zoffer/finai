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

    const nickname = `USER_${customNanoid(8)}`;
    const newUsers = await db.insert(tUser).values({ nickname, email }).returning();

    return newUsers[0]!;
}

export default defineApiEventHandler(async (event: H3Event<{ body: z.input<typeof zParameter> }>) => {
    const body = await apiParameterParse(zParameter, await readBody(event));

    const isValid = await verifyCode(body.email, body.code);
    if (!isValid) {
        return new ApiError({
            code: "invalid_code",
            message: "验证码错误或已过期",
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
