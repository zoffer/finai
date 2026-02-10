import { ApiError, HTTP_STATUS } from "~~/server/utils/api";
import { getAuth } from "~~/server/utils/auth/auth";
import { AUTH_KEY } from "~~/server/utils/auth/keys";

export default defineEventHandler(async (event) => {
    const url = getRequestURL(event);
    if (!url.pathname.startsWith("/api/")) {
        return;
    }

    if (url.pathname.startsWith("/api/auth/")) {
        return;
    }

    try {
        await getAuth(event);
    } catch (error) {
        if (error instanceof ApiError) {
            setResponseStatus(event, error.statusCode);
            return error.body;
        }
        console.error(error);
        setResponseStatus(event, HTTP_STATUS.SERVER_ERROR);
        setCookie(event, AUTH_KEY, "", {
            httpOnly: true,
            secure: !import.meta.dev,
            sameSite: "lax",
            maxAge: 0,
        });
        return new ApiError({ code: "unknown", message: "server error" }).body;
    }
});
