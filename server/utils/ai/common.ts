import PQueue from 'p-queue';
import { generateObject } from "ai";
import { createDeepSeek } from '@ai-sdk/deepseek';
import z from 'zod';

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

    return object;
}