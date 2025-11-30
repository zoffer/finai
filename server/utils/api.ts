import type { EventHandlerRequest, EventHandlerResponse, EventHandler } from "h3";
// https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status
export enum HTTP_STATUS {
    OK = 200,

    MOVED_PERMANENTLY = 301, // 请求资源的 URL 已永久更改
    FOUND = 302, // 请求资源的 URI 已暂时更改

    BAD_REQUEST = 400, // 客户端错误
    UNAUTHORIZED = 401, // 未认证错误
    NOT_FOUND = 404,

    SERVER_ERROR = 500,
}

export class ApiError {
    statusCode: HTTP_STATUS = HTTP_STATUS.BAD_REQUEST;
    code: string;
    message: string;
    constructor(options: { code: string; message: string }) {
        this.code = options.code;
        this.message = options.message;
    }
    setHttpStatus(statusCode: HTTP_STATUS) {
        this.statusCode = statusCode;
        return this;
    }
    body() {
        return { code: this.code, message: this.message };
    }
}

type ApiResponse<T = any> = EventHandlerResponse<T | ApiError>;

export function defineApiEventHandler<
    Request extends EventHandlerRequest = EventHandlerRequest,
    T = any
>(handler: EventHandler<Request, ApiResponse<T>>): EventHandler<Request, EventHandlerResponse<T>> {
    return defineEventHandler(async (event) => {
        try {
            const res = await handler(event);
            if (res instanceof ApiError) {
                setResponseStatus(event, res.statusCode);
                return res.body();
            }
            return res;
        } catch (error: any) {
            if (error instanceof ApiError) {
                setResponseStatus(event, error.statusCode);
                return error.body();
            }
            console.error(error);
            setResponseStatus(event, HTTP_STATUS.SERVER_ERROR);
            if (error != null && typeof error.message == "string") {
                return new ApiError({ code: "unknown", message: error.message }).body();
            }
            return new ApiError({ code: "unknown", message: "unknown error" }).body();
        }
    }) as EventHandler<Request, EventHandlerResponse<T>>;
}
