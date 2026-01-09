import zhipuProvider from "./zhipu";
import cloudflareProvider from "./cloudflare";

export const aiProvider = Object.freeze({
    zhipu: zhipuProvider,
    cloudflare: cloudflareProvider,
});
