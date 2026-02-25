import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { streamText } from "ai";
import { ref, shallowRef, onMounted, onUnmounted } from "vue";
import { useAIProvider, type CHAT_MODEL_IDS } from "../provider";
import { useRequestURL } from "#app";

interface TextPart {
    type: "text";
    text: string;
}

interface ReasoningPart {
    type: "reasoning";
    text: string;
    showReasoning?: boolean;
}

interface ToolCallPart {
    type: "tool-call";
    toolCallId: string;
    toolName: string;
    input: unknown;
    showToolCall?: boolean;
}

interface ToolResultPart {
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
                  value: string;
              }>;
          };
    showToolResult?: boolean;
}

type SystemModelMessage = {
    role: "system";
    content: string;
};

type UserModelMessage = {
    role: "user";
    content: Array<TextPart>;
};

type AssistantModelMessage = {
    role: "assistant";
    content: Array<TextPart | ReasoningPart | ToolCallPart>;
};

type ToolModelMessage = {
    role: "tool";
    content: Array<ToolResultPart>;
};

type ModelMessage = SystemModelMessage | UserModelMessage | AssistantModelMessage | ToolModelMessage;

export function useFinaiAgent() {
    const messages = ref<Array<ModelMessage>>([]);
    const status = ref<"idle" | "pending" | "success" | "error">("idle");
    const error = ref<Error | unknown | null>(null);
    const provider = useAIProvider();
    const mcpClient = useMCPClient();
    let abortController: AbortController | null = null;
    const cancel = () => {
        abortController?.abort();
        abortController = null;
    };
    const sendMessage = async (message: UserModelMessage, options: { model: CHAT_MODEL_IDS; maxSteps?: number }) => {
        messages.value.push(message);
        const { model, maxSteps = 16 } = options;
        const tools = await mcpClient.value?.tools();
        abortController?.abort();
        abortController = new AbortController();
        for (let i = 0; i < maxSteps; i++) {
            const messagesData = messages.value.map((message) => handleMessage(message));
            const { fullStream, finishReason } = await streamText({
                model: provider.chatModel(model),
                messages: messagesData,
                abortSignal: abortController.signal,
                tools,
            });
            messages.value.push({ role: "assistant", content: [] });
            const assistantMessage = messages.value[messages.value.length - 1] as AssistantModelMessage;
            let reasoningPart: ReasoningPart | null = null;
            let textPart: TextPart | null = null;
            for await (const part of fullStream) {
                switch (part.type) {
                    case "reasoning-start": {
                        assistantMessage.content.push({ type: "reasoning", text: "" });
                        reasoningPart = assistantMessage.content[assistantMessage.content.length - 1] as ReasoningPart;
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
                        break;
                    }
                    case "text-start": {
                        assistantMessage.content.push({ type: "text", text: "" });
                        textPart = assistantMessage.content[assistantMessage.content.length - 1] as TextPart;
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
                    case "tool-result": {
                        let output: ToolResultPart["output"];
                        if (
                            typeof part.output === "object" &&
                            part.output !== null &&
                            "content" in part.output &&
                            part.output.content != null
                        ) {
                            output = { type: "content", value: part.output.content as Array<{ type: "text"; value: string }> };
                        } else {
                            output = { type: "text", value: String(part.output) };
                        }
                        messages.value.push({
                            role: "tool",
                            content: [
                                {
                                    type: "tool-result",
                                    toolCallId: part.toolCallId,
                                    toolName: part.toolName,
                                    output,
                                },
                            ],
                        });
                        break;
                    }
                }
            }
            if ((await finishReason) !== "tool-calls") {
                break;
            }
        }
    };
    const send = async (args: Parameters<typeof sendMessage>) => {
        status.value = "pending";
        error.value = null;
        try {
            await sendMessage(...args);
            status.value = "success";
        } catch (err) {
            error.value = err;
            status.value = "error";
        }
    };
    return { send, cancel, messages, status, error };
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
