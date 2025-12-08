import PQueue from 'p-queue';
import { generateObject } from "ai";
import { createDeepSeek } from '@ai-sdk/deepseek';
import z from 'zod';
import { tAiLog } from '~~/drizzle/schema/ai';

export const AiTaskQueue = new PQueue({ concurrency: 1 });

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function runAiTask<T extends z.Schema>(SystemPrompt: string, prompt: string, schema: T) {
    const { usage, object, request, response } = await generateObject({
        model: deepseek("deepseek-reasoner"),
        system: SystemPrompt,
        temperature: 0,
        prompt,
        schema,
    })

    console.log("AI usage:", await usage);

    await db.insert(tAiLog).values({
        model: response.modelId,
        request_body: typeof request.body === "string" ? request.body : JSON.stringify(request.body),
        response_body: typeof response.body === "string" ? response.body : JSON.stringify(response.body),
    });

    return object;
}