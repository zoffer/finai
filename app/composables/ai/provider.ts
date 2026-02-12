import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { useRequestURL } from "#app";

type CHAT_MODEL_IDS = "GLM-4.5-Flash" | "GLM-4.7-Flash";

const getBaseURL = () => {
    const url = useRequestURL();
    const baseURL = new URL(url.origin);
    baseURL.pathname = "/api/ai/gateway/";
    return baseURL.toString();
};

export const useAIProvider = () => {
    return createOpenAICompatible<CHAT_MODEL_IDS, never, never, never>({
        name: "finai",
        baseURL: getBaseURL(),
        includeUsage: true,
        supportsStructuredOutputs: true,
    });
};
