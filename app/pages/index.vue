<template>
  <div class="min-h-screen bg-linear-to-br from-bg-surface to-bg flex flex-col items-center">

    <!-- Main Content -->
    <main class="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
      <!-- Search and Filter Section -->
      <div class="bg-bg rounded-2xl shadow-md shadow-shadow p-4 sm:p-6 mb-6 sm:mb-8 transition-all duration-300">
        <div class="flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between">
          <!-- Search Box -->
          <div class="relative flex-1">
            <input type="text" v-model="searchQuery" placeholder="搜索股票代码或名称..."
              class="block w-full pl-9 pr-3 py-2.5 sm:pl-10 sm:pr-4 sm:py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm font-medium transition-all duration-200 bg-bg-surface focus:bg-bg text-text" />
            <svg class="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-text-muted" viewBox="0 0 24 24"
              width="18" sm:width="20" height="18" sm:height="20" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

        </div>
      </div>

      <!-- Stock Table -->
      <div
        class="bg-bg rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl min-h-[300px]">
        <!-- Loading State -->
        <div v-if="!isSilence && isLoading" class="flex flex-col items-center justify-center py-20 px-6">
          <div class="w-16 h-16 border-4 border-secondary border-t-primary rounded-full animate-spin mb-4"></div>
          <p class="text-text font-medium">加载中，请稍候...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="!stocks || stocks.length === 0"
          class="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div class="w-auto text-text-muted mb-4">
            <svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" stroke-width="1"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <p class="text-text font-medium text-base sm:text-lg">{{ searchQuery ? '没有找到匹配的股票' : '暂无股票数据' }}</p>
        </div>

        <!-- Stock Table Container with Horizontal Scroll for Mobile -->
        <div v-else class="sm:mx-0 overflow-x-auto">
          <PagesIndexStockTable :data="stocks" @item-click="goToDetail" />
        </div>
      </div>
    </main>

  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

const searchQuery = ref('')

const isSilence = ref(false)

let debounceTimer: Parameters<typeof clearTimeout>[0]
watch(searchQuery, (newQuery) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    refreshStockData()
  }, 300)
})


const { data: stocks, pending: isLoading, refresh } = useAsyncData(async ({ $api }, { signal }) => {
  const res = await $api("/api/stock/list/hot", {
    signal,
    query: { size: 100, search: searchQuery.value },
  })
  return res.data
});

let silenceRefreshTimer: Parameters<typeof clearTimeout>[0]
const refreshStockData = (silence = false) => {
  clearTimeout(silenceRefreshTimer)
  isSilence.value = true
  if (!silence) {
    silenceRefreshTimer = setTimeout(() => {
      isSilence.value = false
    }, 300)
  }
  refresh()
}

const goToDetail = (stock: { id: string }) => {
  navigateTo({ path: `/stock/view/${stock.id}`, })
}

</script>
