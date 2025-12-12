// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // https://nuxt.com/docs/4.x/api/nuxt-config#runtimeconfig-1
  vite: { build: { target: "es2015" } },

  pwa: {
    devOptions: { enabled: true },
    manifest: {
      name: "finai",
      short_name: "finai",
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png"
        }, {
          src: "/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png"
        },
      ],
    }
  },

  experimental: {
    // https://nuxt.com/docs/4.x/guide/going-further/experimental-features#entryimportmap
    entryImportMap: false,
  },

  modules: ["@nuxtjs/tailwindcss", "@vite-pwa/nuxt"],
})