<template>
  <div class="min-h-screen bg-linear-to-br from-bg-surface to-bg flex flex-col items-center">

    <!-- Main Content -->
    <main class="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
      <!-- Search and Filter Section -->
      <div class="bg-bg rounded-2xl shadow-md shadow-shadow p-4 sm:p-6 mb-6 sm:mb-8 transition-all duration-300">
        <div class="flex flex-row gap-3 sm:gap-4 items-center justify-between min-w-0">
          <!-- Search Box -->
          <div class="relative flex-1 min-w-0">
            <input type="text" v-model="searchQuery" placeholder="搜索股票代码或名称..."
              class="block w-full pl-9 pr-3 py-2.5 sm:pl-10 sm:pr-4 sm:py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm font-medium transition-all duration-200 bg-bg-surface focus:bg-bg text-text" />
            <svg class="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-text-muted" viewBox="0 0 24 24"
              width="18" sm:width="20" height="18" sm:height="20" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          <!-- Chat Button -->
          <button @click="goToChat"
            class="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-border hover:border-primary hover:bg-bg-surface/50 transition-all duration-200 text-text hover:text-primary shrink-0"
            title="AI 助手">
            <svg viewBox="0 0 1000 1000" width="28" sm:width="30" height="28" sm:height="30" fill="currentColor">
              <path
                d="M576 192v64H352A160 160 0 0 0 192 416v192A160 160 0 0 0 352 768h320A160 160 0 0 0 832 608v-192h64v192a224 224 0 0 1-224 224h-320A224 224 0 0 1 128 608v-192A224 224 0 0 1 352 192H576z m73.344 217.344l45.312 45.312-3.52 3.456-39.168 39.168-12.608 12.608L637.248 512l57.408 57.344-45.312 45.312-80-80a32 32 0 0 1 0-45.312l17.28-17.28 20.096-20.032 21.12-21.184 3.84-3.712 14.208-14.272 3.456-3.52zM432 416v192H352v-192h80z m351.488-292.032c8.128 31.168 21.824 56.192 41.088 75.52 19.2 19.2 44.288 32.896 75.52 41.024 15.872 4.16 15.872 26.816 0 30.976-31.232 8.128-56.32 21.824-75.52 41.088-19.2 19.2-32.96 44.288-41.088 75.52-4.16 15.872-26.816 15.872-30.976 0-8.128-31.232-21.824-56.32-41.088-75.52-19.2-19.2-44.288-32.96-75.52-41.088-15.872-4.16-15.872-26.816 0-30.976 31.232-8.128 56.32-21.824 75.52-41.088 19.2-19.2 32.96-44.288 41.088-75.52 4.16-15.872 26.816-15.872 30.976 0z">
              </path>
            </svg>
          </button>

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

const goToChat = () => {
  navigateTo({ path: '/chat', })
}

</script>
