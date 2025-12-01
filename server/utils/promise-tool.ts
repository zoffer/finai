export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function retry<T>(fn: () => Promise<T>, { delay = 0, retries = 3 } = {}): Promise<T> {
    return fn().catch(async (err) => {
        if (retries <= 0) {
            throw err;
        }
        await sleep(delay);
        return retry(fn, { delay, retries: retries - 1 });
    });
}