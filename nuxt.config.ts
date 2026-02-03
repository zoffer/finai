// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    devtools: { enabled: true },

    imports: {
        scan: false, // https://nuxt.com/docs/4.x/api/nuxt-config#scan
    },

    css: ["./app/assets/global/css/main.css"],

    // https://nuxt.com/docs/4.x/api/nuxt-config#runtimeconfig-1
    vite: {
        build: { target: "es2015" },
        plugins: [tailwindcss()],
    },

    experimental: {
        // https://nuxt.com/docs/4.x/guide/going-further/experimental-features#entryimportmap
        entryImportMap: false,
    },

    modules: ["@nuxtjs/mcp-toolkit", "@nuxt/test-utils/module"],
    mcp: {
        name: "FinAI MCP Server",
        route: "/mcp",
    },
});
