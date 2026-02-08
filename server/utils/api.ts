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
    constructor(options: { code: string; message: string; statusCode?: HTTP_STATUS }) {
        this.code = options.code;
        this.message = options.message;
        this.statusCode = options.statusCode || HTTP_STATUS.BAD_REQUEST;
    }
    setHttpStatus(statusCode: HTTP_STATUS) {
        this.statusCode = statusCode;
        return this;
    }
    get body() {
        return { code: this.code, message: this.message };
    }
}

type ApiResponse<T = any> = EventHandlerResponse<T | ApiError>;

export function defineApiEventHandler<Request extends EventHandlerRequest = EventHandlerRequest, T = any>(
    handler: EventHandler<Request, ApiResponse<T>>,
): EventHandler<Request, EventHandlerResponse<T>> {
    return defineEventHandler(async (event) => {
        try {
            const res = await handler(event);
            if (res instanceof ApiError) {
                throw res;
            }
            return res;
        } catch (error: any) {
            if (error instanceof ApiError) {
                setResponseStatus(event, error.statusCode);
                return error.body;
            }
            console.error(error);
            setResponseStatus(event, HTTP_STATUS.SERVER_ERROR);
            return new ApiError({ code: "unknown", message: "server error" }).body;
        }
    }) as EventHandler<Request, EventHandlerResponse<T>>;
}
