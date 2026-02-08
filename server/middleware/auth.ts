import { ApiError, HTTP_STATUS } from "~~/server/utils/api";
import { getAuth } from "~~/server/utils/auth/auth";

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
        return new ApiError({ code: "unknown", message: "server error" }).body;
    }
});
