const NUXT_AKTOOLS_URL = process.env.NUXT_AKTOOLS_URL;

export const AKTOOLS = Object.freeze({
    async stock_info_a_code_name() {
        const url = `${NUXT_AKTOOLS_URL}/api/public/stock_info_a_code_name`;
        return await $fetch<Array<{ code: string; name: string }>>(url);
    }
});