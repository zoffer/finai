import { AUTH_TOKEN_KEY } from "~~/shared/utils/keys";
export default defineNuxtPlugin((nuxtApp) => {
    const api = $fetch.create({
        onRequest({ request, options, error }) {
            const token = useCookie(AUTH_TOKEN_KEY, { readonly: true });
            options.headers.set(AUTH_TOKEN_KEY, token.value || "");
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
