import type { H3Event } from "h3";
import z from "zod";
import { apiParameterParse } from "~~/server/utils/zod/parse";
import { defineApiEventHandler } from "~~/server/utils/api";
import { ZAI_BASE_URL } from "~~/server/utils/ai/provider/zhipu";

const zMessage = z.object({
    role: z.enum(["system", "user", "assistant", "tool"]),
    content: z.union([z.string(), z.array(z.any())]),
    tool_calls: z.array(z.any()).optional(),
    tool_call_id: z.string().optional(),
});

const zParameter = z.object({
    model: z.string().min(1),
    messages: z.array(zMessage).min(1),
    stream: z.boolean().default(false),
    temperature: z.number().min(0).max(2).optional(),
    top_p: z.number().min(0).max(1).optional(),
    max_tokens: z.number().int().positive().optional(),
    tools: z.array(z.any()).optional(),
    tool_choice: z.union([z.string(), z.object({ type: z.string(), function: z.object({ name: z.string() }) })]).optional(),
    response_format: z.object({ type: z.enum(["text", "json_object"]) }).optional(),
});

function getAbortController(event: H3Event) {
    const res = event.node.res;
    const req = event.node.req;
    const abortController = new AbortController();
    // 请求中断时触发取消
    req.on("close", () => {
        console.log("请求中断，正在取消操作...");
        abortController.abort(); // 取消异步操作
    });
    // 响应中断时触发取消
    res.on("close", () => {
        console.log("响应中断，正在取消操作...");
        abortController.abort(); // 取消异步操作
    });
    return abortController;
}

async function transformRequestBody(body: z.infer<typeof zParameter>) {
    body.max_tokens = Math.min(body.max_tokens || 8192, 8192);
    return body;
}

async function proxyRequest(body: z.infer<typeof zParameter>, event: H3Event) {
    const baseUrl = ZAI_BASE_URL.endsWith("/") ? ZAI_BASE_URL : `${ZAI_BASE_URL}/`;
    const url = new URL(`${baseUrl}chat/completions`);

    return fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.ZAI_API_KEY}`,
        },
        signal: getAbortController(event).signal,
        body: JSON.stringify(body),
    });
}

export default defineApiEventHandler(async (event: H3Event<{ body: z.input<typeof zParameter> }>) => {
    const body = await apiParameterParse(zParameter, await readBody(event));
    const transformedBody = await transformRequestBody(body);

    return proxyRequest(transformedBody, event);
});
