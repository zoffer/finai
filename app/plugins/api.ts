export default defineNuxtPlugin((nuxtApp) => {
    const api = $fetch.create({
        onRequest({ request, options, error }) {
            if (import.meta.server) {
                const url = typeof request === "string" ? request : request.url;
                const isExternal = url.startsWith("http://") || url.startsWith("https://");
                if (!isExternal) {
                    // 仅在非外部请求时添加cookie
                    const cookie = useRequestHeader("cookie") || "";
                    options.headers.set("cookie", cookie);
                }
            }
        },
        async onResponseError({ response }) {
            // 处理未授权错误（401）
            // 当用户未登录或登录过期时，重定向到登录页面
            if (response.status === 401) {
                await nuxtApp.runWithContext(() => navigateTo("/login"));
                return;
            }
            const { _data: data } = response;

            if (data && data.message) {
                console.error(data);
            } else {
                console.error(response);
            }
        },
    });

    // Expose to useNuxtApp().$api
    return { provide: { api } };
});
