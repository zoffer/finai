<template>
  <div class="min-h-screen flex flex-col bg-linear-to-br from-bg-surface to-bg">
    <!-- Header -->
    <PagesStockInfoHeader :data="stock" />

    <!-- Candlestick Chart Card -->
    <LightweightChartsCandlestick class="w-full aspect-21/9 min-h-[300px] max-h-[66vh]" :data="history" />

    <!-- Main Content -->
    <main class="flex-1 px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 px-4">
        <div class="w-16 h-16 border-4 border-secondary border-t-primary rounded-full animate-spin mb-4"></div>
        <p class="text-text font-medium">加载中，请稍候...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex flex-col items-center justify-center py-20 px-4 text-center">
        <svg class="w-16 h-16 text-error mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12" y2="16"></line>
        </svg>
        <p class="text-text font-medium text-lg mb-6">{{ error }}</p>
        <button @click="refresh()"
          class="px-6 py-3 bg-linear-to-r from-primary to-secondary text-text font-medium rounded-xl hover:from-primary hover:to-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform hover:scale-105 active:scale-95">
          重试
        </button>
      </div>

      <!-- Stock Detail Content -->
      <div v-else-if="stock" class="space-y-6">

        <!-- Company Info and Keywords Tab Card -->
        <PagesStockInfoCard :introduction="stock.introduction" :stockId="stockId" />

        <!-- News List Card -->
        <PagesStockInfoNewsList :stockId="stockId" />
      </div>
    </main>

  </div>
</template>

<script lang="ts" setup>
const route = useRoute()

const stockId = computed(() => route.params.id as string)

const { data: stock, pending: isLoading, error, refresh } = useAsyncData(`stock-${stockId.value}`, async ({ $api }, { signal }) => {
  const res = await $api("/api/stock/info", {
    query: { id: stockId.value },
    signal
  })
  return res.data
})

const { data: history } = useAsyncData(`history-${stockId.value}`, async ({ $api }, { signal }) => {
  const res = await $api("/api/stock/history", {
    query: { id: stockId.value },
    signal
  })
  return res.data
})

</script>
