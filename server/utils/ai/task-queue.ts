import PQueue from 'p-queue';

export const AiTaskQueue = new PQueue({ concurrency: 1 });