import z from "zod";
import type { H3Event } from "h3";
import { verify } from "~~/server/utils/auth/jwt";
import { AUTH_KEY } from "~~/server/utils/auth/keys";
import { ApiError, HTTP_STATUS } from "~~/server/utils/api";

const schema = z.object({
    id: z.string().trim(),
});

type AuthContext = z.infer<typeof schema>;

function getToken(event: H3Event): string | null {
    const token = getCookie(event, AUTH_KEY);
    if (token) {
        return token;
    }

    const authHeader = getHeader(event, "Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }

    return null;
}

async function handleToken(token: string | null): Promise<AuthContext> {
    if (!token) {
        throw new Error("认证令牌不存在");
    }

    const result = await verify(token);
    const userId = result.payload.id;

    if (!userId || typeof userId != "string") {
        throw new Error("无效认证令牌");
    }

    return { id: userId };
}

export async function getAuth(event: H3Event): Promise<AuthContext> {
    const res = schema.safeParse(event.context.auth);
    if (res.success) {
        return res.data;
    }
    try {
        const token = getToken(event);
        const user = await handleToken(token);
        event.context.auth = user;
        return user;
    } catch (error) {
        return Promise.reject(
            new ApiError({
                statusCode: HTTP_STATUS.UNAUTHORIZED,
                code: "unauthorized",
                message: "无效认证令牌",
            }),
        );
    }
}
