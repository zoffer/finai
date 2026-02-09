import type { H3Event } from "h3";
import z from "zod";
import { apiParameterParse } from "~~/server/utils/zod/parse";
import { rd } from "~~/server/utils/redis";
import { REDIS_KEYS } from "~~/server/utils/redis/keys";
import { ApiError } from "~~/server/utils/api";
import { randomInt } from "crypto";
import { AUTH_LOCK, LOCK_LOGIN_DURATION_HOURS } from "~~/server/utils/auth/lock";

const EXPIRATION_MINUTES = 5;
const COOLDOWN_SECONDS = 60;

const zParameter = z.object({
    email: z.email("邮箱格式不正确").trim(),
});

async function generateVerificationCode(): Promise<string> {
    return randomInt(100000, 999999).toString();
}

async function checkCooldown(email: string): Promise<boolean> {
    const key = REDIS_KEYS.verification.cooldown(email);
    const exists = await rd.exists(key);
    return exists === 1;
}

async function sendVerificationEmail(email: string, code: string): Promise<void> {
    const response = await fetch(`${process.env.GATEWAY_URL}/api/tool/email/code`, {
        method: "POST",
        headers: {
            Authorization: process.env.GATEWAY_SECRET || "",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            subject: `验证码：${code}`,
            title: "验证码",
            email: email,
            operation: "登录",
            code: code,
            expiration: `${EXPIRATION_MINUTES}分钟`,
        }),
    });

    const result = await response.json();

    if (!result.ok) {
        console.error(result);
        throw new ApiError({
            code: "email_send_failed",
            message: "邮件发送失败",
        });
    }
}

async function storeVerificationCodeAndSetCooldown(email: string, code: string): Promise<void> {
    const codeKey = REDIS_KEYS.verification.code(email);
    const cooldownKey = REDIS_KEYS.verification.cooldown(email);
    const codeExpiresIn = EXPIRATION_MINUTES * 60;

    await rd.multi().setEx(codeKey, codeExpiresIn, code).setEx(cooldownKey, COOLDOWN_SECONDS, "1").exec();
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

    const isOnCooldown = await checkCooldown(body.email);
    if (isOnCooldown) {
        return new ApiError({
            code: "cooldown",
            message: "验证码发送过于频繁，请稍后再试",
        });
    }

    const code = await generateVerificationCode();
    await sendVerificationEmail(body.email, code);
    await storeVerificationCodeAndSetCooldown(body.email, code);
    return {
        message: "验证码已发送",
        email: body.email,
    };
});
