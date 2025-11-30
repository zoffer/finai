import type { H3Event } from "h3";

export default defineApiEventHandler(async (event: H3Event) => {
    return new ApiError({
        code: "not_found",
        message: "路径不存在"
    }).setHttpStatus(HTTP_STATUS.NOT_FOUND);
});
