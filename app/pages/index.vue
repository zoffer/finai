<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center">

    <!-- Main Content -->
    <main class="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
      <!-- Search and Filter Section -->
      <div class="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 transition-all duration-300 hover:shadow-2xl">
        <div class="flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between">
          <!-- Search Box -->
          <div class="relative flex-1">
            <input type="text" v-model="searchQuery" placeholder="搜索股票代码或名称..."
              class="block w-full pl-9 pr-3 py-2.5 sm:pl-10 sm:pr-4 sm:py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none text-sm font-medium transition-all duration-200 bg-gray-50 focus:bg-white" />
            <svg class="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" viewBox="0 0 24 24"
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
        class="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl min-h-[300px]">
        <!-- Loading State -->
        <div v-if="!isSilence && isLoading" class="flex flex-col items-center justify-center py-20 px-6">
          <div class="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p class="text-gray-600 font-medium">加载中，请稍候...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="!stocks || stocks.length === 0"
          class="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div class="w-auto text-gray-300 mb-4">
            <svg viewBox="0 0 24 24" width="60" height="60" fill="none" stroke="currentColor" stroke-width="1"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <p class="text-gray-600 font-medium text-base sm:text-lg">{{ searchQuery ? '没有找到匹配的股票' : '暂无股票数据' }}</p>
        </div>

        <!-- Stock Table Container with Horizontal Scroll for Mobile -->
        <div v-else class="sm:mx-0 overflow-x-auto">
          <table class="w-full divide-y divide-gray-200 table-fixed min-w-[840px]">
            <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th scope="col"
                  class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky left-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100">
                  股票名称
                </th>

                <th scope="col"
                  class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  当前价格
                </th>
                <th scope="col"
                  class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  涨跌幅
                </th>
                <th scope="col"
                  class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  成交额
                </th>
                <th scope="col"
                  class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  新闻影响
                </th>
                <th scope="col"
                  class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  新闻数量
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              <tr v-for="(stock, i) in stocks || []" :key="stock.id"
                class="group transition-all duration-300 hover:bg-gray-50 cursor-pointer active:bg-gray-100"
                :style="{ animationDelay: `${i * 30}ms` }" @click="goToDetail(stock)">
                <td
                  class="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap sticky left-0 z-0 bg-white group-hover:bg-gray-50">
                  <div class="text-sm text-gray-600">
                    {{ stock.name }}
                  </div>
                  <div class="text-xs text-gray-400">
                    {{ stock.symbol }}
                  </div>
                </td>
                <td class="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                  <div class="text-sm font-bold text-gray-900">
                    ¥{{ stock.price.toFixed(2) }}
                  </div>
                </td>
                <td class="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                  <div class="flex items-center gap-1 sm:gap-2 text-sm font-bold"
                    :class="[stock.change > 0 ? 'text-red-500' : 'text-green-500']">
                    <span>
                      <svg v-if="stock.change > 0" viewBox="0 0 24 24" width="14" height="14" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 13.5 13.5 8.5 8.5 1 16"></polyline>
                      </svg>
                      <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
                        stroke-width="2">
                        <polyline points="23 16 13.5 6.5 8.5 11.5 1 4"></polyline>
                      </svg>
                    </span>
                    {{ stock.change > 0 ? '+' : '' }}{{ stock.change.toFixed(2) }}%
                  </div>
                </td>
                <td class="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                  <div class="text-sm text-gray-500 font-mono">
                    {{ formatVolume(stock.turnover) }}
                  </div>
                </td>
                <td class="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                  <div class="flex items-center gap-1 sm:gap-2 text-sm font-bold"
                    :class="[stock.news_effect > 0 ? 'text-red-500' : stock.news_effect < 0 ? 'text-green-500' : 'text-gray-500']">
                    <span>
                      <svg v-if="stock.news_effect > 0" viewBox="0 0 24 24" width="14" height="14" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 13.5 13.5 8.5 8.5 1 16"></polyline>
                      </svg>
                      <svg v-else-if="stock.news_effect < 0" viewBox="0 0 24 24" width="14" height="14" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <polyline points="23 16 13.5 6.5 8.5 11.5 1 4"></polyline>
                      </svg>
                    </span>
                    {{ stock.news_effect ? stock.news_effect.toFixed(2) : '0.00' }}
                  </div>
                </td>
                <td class="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                  <div class="flex items-center gap-1 sm:gap-2 text-sm font-medium text-blue-600">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {{ stock.news_count || 0 }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

// 股票数据状态
const searchQuery = ref('')

const isSilence = ref(false)

// 格式化成交量（符合中文习惯）
const formatVolume = (volume: number) => {
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(2) + '亿'
  } else if (volume >= 10000) {
    return (volume / 10000).toFixed(2) + '万'
  }
  return volume.toString()
}

// 监听搜索查询变化，自动刷新数据
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
  return res.data.map(stock => {
    // 计算涨跌幅
    const currentPrice = stock.price || 0
    const openPrice = stock.open || 0
    const change = openPrice > 0 ? ((currentPrice - openPrice) / openPrice * 100) : 0

    return {
      ...stock,
      change: parseFloat(change.toFixed(2)),
    }
  })
});

let silenceRefreshTimer: Parameters<typeof clearTimeout>[0]
const refreshStockData = (silence = false) => {
  clearTimeout(silenceRefreshTimer)
  isSilence.value = true
  if (!silence) {
    // 延时显示，避免 immediate 刷新时闪烁
    silenceRefreshTimer = setTimeout(() => {
      isSilence.value = false
    }, 300)
  }
  refresh()
}

// 定时器引用
let refreshTimer: Parameters<typeof clearInterval>[0]
// 设置每分钟自动刷新
onMounted(() => {
  // 首次加载完成后，设置定时器
  refreshTimer = setInterval(() => {
    refreshStockData(true)
  }, 60000) // 60秒 = 1分钟
})
// 组件卸载时清除定时器
onUnmounted(() => {
  clearInterval(refreshTimer)
})

// 跳转到详情页面
const goToDetail = (stock: { id: string }) => {
  navigateTo(`/stock/${stock.id}`)
}

</script>

<style scoped>
/* 全局动画定义 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

tr {
  animation: fadeInUp 0.5s ease forwards;
}

/* 移动端触摸反馈优化 */
@media (max-width: 640px) {
  tr:active {
    background-color: rgba(243, 244, 246, 0.5);
  }
}
</style>