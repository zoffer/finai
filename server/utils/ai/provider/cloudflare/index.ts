import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

type CHAT_MODEL_IDS = '@cf/qwen/qwen3-30b-a3b-fp8'
type EMBEDDING_MODEL_IDS = '@cf/qwen/qwen3-embedding-0.6b'

export default createOpenAICompatible<CHAT_MODEL_IDS, never, EMBEDDING_MODEL_IDS, never>({
    name: 'cloudflare.com',
    apiKey: process.env.CF_AI_API_KEY,
    baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_AI_ACCOUNT_ID}/ai/v1`,
    includeUsage: true, // Include usage information in streaming responses
    supportsStructuredOutputs: true,
});