import type { H3Event } from "h3";
import { verify } from "./jwt";
export async function checkLoginStatus(event: H3Event) {
    const err = new ApiError("unauthorized", "未登录").setHttpStatus(HTTP_STATUS.UNAUTHORIZED);
    const token = getHeader(event, AUTH_TOKEN_KEY);
    if (!token) {
        return Promise.reject(err);
    }
    const { payload } = await verify(token);
    if (payload.exp && payload.exp * 1000 > Date.now()) {
        if (payload.id && typeof payload.id == "string") {
            return payload.id;
        }
    }
    return Promise.reject(err);
}
