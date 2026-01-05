function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

type RetryOptions = {
    delay?: number | ((i: number) => number);
    retries?: number;
}

function retry<T>(fn: () => Promise<T>, { delay = 0, retries = 2 }: RetryOptions = {}): Promise<T> {
    return new Promise((resolve, reject) => {
        const retryFn = (i: number) => {
            fn().then(resolve).catch((err) => {
                console.error(err);
                if (i <= retries) {
                    console.log(`Retry ${i} times`);
                    const d = typeof delay === 'function' ? delay(i) : delay;
                    sleep(Math.max(d, 0)).then(() => retryFn(i + 1));
                } else {
                    reject(err);
                }
            });
        };
        retryFn(1);
    });
}

export const PromiseTool = {
    sleep,
    retry,
}