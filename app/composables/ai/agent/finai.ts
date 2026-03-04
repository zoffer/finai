import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { streamText, APICallError, RetryError } from "ai";
import { ref, shallowRef, onMounted, onUnmounted } from "vue";
import { useAIProvider, type CHAT_MODEL_IDS } from "../provider";
import { useRequestURL } from "#app";
import { navigateToLogin } from "@/utils/router/login";

interface TextPart {
    type: "text";
    text: string;
}

interface ReasoningPart {
    type: "reasoning";
    text: string;
}

interface ToolCallPart {
    type: "tool-call";
    toolCallId: string;
    toolName: string;
    input: unknown;
}

export interface ToolResultPart {
    type: "tool-result";
    toolCallId: string;
    toolName: string;
    output:
        | {
              type: "text";
              value: string;
          }
        | {
              type: "content";
              value: Array<{
                  type: "text";
                  text: string;
              }>;
          };
}

export type SystemModelMessage = {
    role: "system";
    content: string;
};

export type UserModelMessage = {
    role: "user";
    content: Array<TextPart>;
};

export type AssistantModelMessage = {
    role: "assistant";
    content: Array<TextPart | ReasoningPart | ToolCallPart>;
};

export type ToolModelMessage = {
    role: "tool";
    content: Array<ToolResultPart>;
};

type ModelMessage = SystemModelMessage | UserModelMessage | AssistantModelMessage | ToolModelMessage;

export function useFinaiAgent() {
    const messages = ref<Array<ModelMessage>>([]);
    const status = ref<"idle" | "pending" | "success" | "error" | "cancel">("idle");
    const streamingPart = shallowRef<ModelMessage["content"][number] | null>(null);
    const error = ref<Error | null>(null);
    const provider = useAIProvider();
    const mcpClient = useMCPClient();
    let abortController: AbortController | null = null;
    const sendMessage = async (
        options: { model: CHAT_MODEL_IDS; maxSteps?: number },
        part: UserModelMessage["content"][0],
        ...content: UserModelMessage["content"]
    ) => {
        messages.value.push({
            role: "user",
            content: [part, ...content],
        });
        const { model, maxSteps = Infinity } = options;
        const tools = await mcpClient.value?.tools();
        abortController?.abort();
        abortController = new AbortController();
        for (let i = 0; i < maxSteps; i++) {
            const messagesData = messages.value.map((message) => handleMessage(message));
            const result = await streamText({
                model: provider.chatModel(model),
                messages: messagesData,
                abortSignal: abortController.signal,
                tools,
                async onError(event) {
                    console.error(event);
                    let { error: err } = event;
                    status.value = "error";
                    if (err instanceof RetryError) {
                        err = err.lastError;
                    }
                    if (err instanceof Error) {
                        error.value = err;
                    } else {
                        error.value = new Error(JSON.stringify(err));
                    }
                    if (err instanceof APICallError) {
                        if (err.statusCode === 401) {
                            await navigateToLogin();
                            return;
                        }
                    }
                },
            });
            messages.value.push({ role: "assistant", content: [] });
            const assistantMessage = messages.value[messages.value.length - 1] as AssistantModelMessage;
            let reasoningPart: ReasoningPart | null = null;
            let textPart: TextPart | null = null;
            for await (const part of result.fullStream) {
                switch (part.type) {
                    case "reasoning-start": {
                        assistantMessage.content.push({ type: "reasoning", text: "" });
                        reasoningPart = assistantMessage.content[assistantMessage.content.length - 1] as ReasoningPart;
                        streamingPart.value = reasoningPart;
                        break;
                    }
                    case "reasoning-delta": {
                        if (reasoningPart) {
                            reasoningPart.text += part.text;
                        }
                        break;
                    }
                    case "reasoning-end": {
                        reasoningPart = null;
                        streamingPart.value = null;
                        break;
                    }
                    case "text-start": {
                        assistantMessage.content.push({ type: "text", text: "" });
                        textPart = assistantMessage.content[assistantMessage.content.length - 1] as TextPart;
                        streamingPart.value = textPart;
                        break;
                    }
                    case "text-delta": {
                        if (textPart) {
                            textPart.text += part.text;
                        }
                        break;
                    }
                    case "text-end": {
                        textPart = null;
                        streamingPart.value = null;
                        break;
                    }
                    case "tool-call": {
                        assistantMessage.content.push({
                            type: "tool-call",
                            toolCallId: part.toolCallId,
                            toolName: part.toolName,
                            input: part.input,
                        });
                        break;
                    }
                }
            }
            const finishReason = await result.finishReason;
            if (finishReason === "tool-calls") {
                const content = await result.content;
                const toolMessage: ToolModelMessage = {
                    role: "tool",
                    content: [],
                };
                for (const c of content) {
                    if (c.type === "tool-result") {
                        const toolOutput = c.output;
                        let output: ToolResultPart["output"];
                        if (typeof toolOutput === "string") {
                            output = { type: "text", value: toolOutput };
                        } else if (toolOutput != null && typeof toolOutput === "object" && "content" in toolOutput) {
                            output = { type: "content", value: toolOutput.content as Array<{ type: "text"; text: string }> };
                        } else {
                            output = { type: "text", value: JSON.stringify(toolOutput) };
                        }
                        toolMessage.content.push({
                            type: "tool-result",
                            toolCallId: c.toolCallId,
                            toolName: c.toolName,
                            output,
                        });
                    }
                }
                messages.value.push(toolMessage);
            } else {
                console.log(finishReason);
                if (finishReason === "error") {
                    const rawFinishReason = await result.rawFinishReason;
                    throw new Error(rawFinishReason || "未知错误");
                }
                break;
            }
        }
    };
    const cancel = () => {
        abortController?.abort();
        abortController = null;
    };
    const send = async (...args: Parameters<typeof sendMessage>) => {
        status.value = "pending";
        error.value = null;
        try {
            await sendMessage(...args);
            status.value = "success";
        } catch (err) {
            console.error(err);
            if (error.value != null) {
                status.value = "error";
                return;
            }
            if (abortController === null || abortController.signal.aborted) {
                status.value = "cancel";
                error.value = null;
            } else {
                status.value = "error";
                if (err instanceof Error) {
                    error.value = err;
                } else {
                    error.value = new Error(JSON.stringify(err));
                }
            }
        }
    };
    return { send, cancel, messages, status, error, streamingPart };
}

function handleMessage<T extends ModelMessage>(message: T): T {
    if (message.role === "assistant") {
        return {
            role: "assistant",
            content: message.content.filter((part) => part.type !== "reasoning"),
        } as T;
    }
    return { role: message.role, content: message.content } as T;
}

function useMCPClient() {
    const mcpClient = shallowRef<MCPClient | null>(null);
    onMounted(async () => {
        try {
            const url = useRequestURL();
            // 初始化MCP客户端
            mcpClient.value = await createMCPClient({
                transport: {
                    type: "http",
                    url: `${url.origin}/mcp`,
                },
            });
        } catch (err) {
            console.error(err);
        }
    });
    onUnmounted(() => {
        mcpClient.value?.close();
    });
    return mcpClient;
}
