<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Header -->
    <PagesStockInfoHeader :data="stock" />

    <!-- Candlestick Chart Card -->
    <LightweightChartsCandlestick class="w-full aspect-[21/9] min-h-[300px] max-h-[66vh]" :data="history" />

    <!-- Main Content -->
    <main class="flex-1 px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 px-4">
        <div class="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p class="text-gray-600 font-medium">加载中，请稍候...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex flex-col items-center justify-center py-20 px-4 text-center">
        <svg class="w-16 h-16 text-red-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12" y2="16"></line>
        </svg>
        <p class="text-gray-600 font-medium text-lg mb-6">{{ error }}</p>
        <button @click="refresh()"
          class="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105 active:scale-95">
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

// 获取股票ID
const stockId = computed(() => route.params.id as string)

// 使用useAsyncData获取股票详情
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