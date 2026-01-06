// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    devtools: { enabled: true },

    // https://nuxt.com/docs/4.x/api/nuxt-config#runtimeconfig-1
    vite: { build: { target: "es2015" } },

    experimental: {
        // https://nuxt.com/docs/4.x/guide/going-further/experimental-features#entryimportmap
        entryImportMap: false,
    },

    modules: ["@nuxtjs/tailwindcss", "@nuxt/test-utils/module"],
});
