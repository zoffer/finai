import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

type CHAT_MODEL_IDS = "glm-4.6" | "glm-4.5" | "glm-4.5-air" | "glm-4.5-x" | "glm-4.5-airx" | "glm-4.5-flash" | "glm-4-plus" | "glm-4-airx" | "glm-4-flashx"

export default createOpenAICompatible<CHAT_MODEL_IDS, never, never, never>({
    name: 'bigmodel.cn',
    apiKey: process.env.ZAI_API_KEY,
    baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
    includeUsage: true, // Include usage information in streaming responses
    supportsStructuredOutputs: true,
});