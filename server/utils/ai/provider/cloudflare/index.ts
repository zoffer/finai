import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import PQueue from "p-queue";

const queue = new PQueue({ concurrency: 2, interval: 1000, intervalCap: 1 });

type CHAT_MODEL_IDS = "workers-ai/@cf/qwen/qwen3-30b-a3b-fp8";
type EMBEDDING_MODEL_IDS = "workers-ai/@cf/qwen/qwen3-embedding-0.6b";

export default createOpenAICompatible<CHAT_MODEL_IDS, never, EMBEDDING_MODEL_IDS, never>({
    name: "cloudflare.com",
    apiKey: process.env.CF_WORKERS_AI_API_KEY,
    baseURL: `https://gateway.ai.cloudflare.com/v1/${process.env.CF_ACCOUNT_ID}/finai/compat`,
    includeUsage: true, // Include usage information in streaming responses
    supportsStructuredOutputs: true,
    fetch: (...args) => {
        return queue.add(() => fetch(...args));
    },
});
