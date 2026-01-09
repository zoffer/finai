import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import PQueue from "p-queue";

type CHAT_MODEL_IDS = "glm-4.5-flash";

const queue = new PQueue({ concurrency: 2, interval: 1000 * 30, intervalCap: 1 });

export default createOpenAICompatible<CHAT_MODEL_IDS, never, never, never>({
    name: "bigmodel.cn",
    apiKey: process.env.ZAI_API_KEY,
    baseURL: "https://open.bigmodel.cn/api/paas/v4/",
    includeUsage: true, // Include usage information in streaming responses
    supportsStructuredOutputs: true,
    fetch: (...args) => {
        return queue.add(() => fetch(...args));
    },
});
