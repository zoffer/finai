<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Header -->
    <PagesStockDetailHeader :stock="stock" />

    <!-- Candlestick Chart Card -->
    <LightweightChartsCandlestick class="w-full aspect-[21/9] min-h-[300px] max-h-[66vh]" :data="history"
      :lineData="newsStatistics" />

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
      <div v-else-if="stock" class="space-y-6 animate-fadeIn">



        <!-- Company Info and Keywords Tab Card -->
        <div class="bg-white rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl">
          <!-- Tab Navigation -->
          <div class="flex border-b border-gray-200">
            <button @click="activeTab = 'keywords'"
              class="px-6 py-3 text-sm font-medium transition-all duration-200 flex-1 text-center relative -mb-px"
              :class="[
                activeTab === 'keywords'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              ]">
              关键词
            </button>
            <button @click="activeTab = 'company'"
              class="px-6 py-3 text-sm font-medium transition-all duration-200 flex-1 text-center relative -mb-px"
              :class="[
                activeTab === 'company'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              ]">
              公司信息
            </button>
          </div>

          <!-- Tab Content -->
          <div class="p-6">
            <!-- Company Info Tab -->
            <div v-if="activeTab === 'company'">
              <div>
                {{ stock.introduction || '-' }}
              </div>
            </div>

            <!-- Keywords Tab -->
            <div v-else-if="activeTab === 'keywords'">
              <div v-if="keywords && keywords.length > 0" class="flex flex-wrap gap-3">
                <div v-for="(item, index) in keywords" :key="index" class="tooltip-container relative">
                  <span class="px-3 py-1.5 text-sm rounded-full cursor-help inline-block text-gray-600" :style="{
                    backgroundColor: calcTagColor(item.avg_effect),
                    color: `hsl(${item.avg_effect >= 0 ? 0 : 120}, ${100 * Math.abs(item.avg_effect)}%, 20%)`
                  }">
                    {{ item.keyword }}
                  </span>
                  <!-- Tooltip 内容 -->
                  <div
                    class="tooltip absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg shadow-lg opacity-0 invisible transition-all duration-200 bg-white text-gray-800 text-xs z-50 w-max">
                    <div>
                      <span class="text-gray-600">行情趋势: </span>
                      <span
                        :class="{ 'text-red-500': item.avg_effect > 0, 'text-green-500': item.avg_effect < 0, 'text-gray-500': item.avg_effect === 0 }">
                        {{ item.avg_effect.toFixed(2) }}
                      </span>
                    </div>
                    <div>
                      <span class="text-gray-600">新闻热度: </span>
                      <span class="text-blue-500">{{ item.news_count }}</span>
                    </div>
                    <div>
                      <span class="text-gray-600">关联度: </span>
                      <span class="text-blue-500">{{ item.weight.toFixed(2) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-gray-500 text-center py-4">
                暂无关键词数据
              </div>
            </div>
          </div>
        </div>

        <!-- News List Card -->
        <div class="bg-white rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl">
          <div class="p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-100">24H新闻</h2>

            <!-- News Loading State -->
            <div v-if="isNewsLoading" class="flex flex-col items-center justify-center py-12">
              <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4">
              </div>
              <p class="text-gray-600 font-medium">加载新闻中...</p>
            </div>

            <!-- News Error State -->
            <div v-else-if="newsError" class="flex flex-col items-center justify-center py-12 text-center">
              <svg class="w-12 h-12 text-red-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12" y2="16"></line>
              </svg>
              <p class="text-gray-600 font-medium mb-4">加载新闻失败</p>
              <button @click="() => refreshNews()"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                重试
              </button>
            </div>

            <!-- News List -->
            <div v-else-if="newsList && newsList.length > 0" class="space-y-4">
              <div v-for="(news, index) in newsList" :key="news.id"
                class="p-4 border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all duration-200">
                <div class="flex flex-col md:flex-row md:items-start gap-4">
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-900 transition-colors mb-2 line-clamp-2">
                      {{ news.title }}
                    </h3>
                    <p class="text-gray-600 text-sm mb-3">
                      {{ news.content }}
                    </p>
                    <!-- 添加关键词显示 -->
                    <div v-if="news.keywords && news.keywords.length > 0" class="mb-2 flex flex-wrap gap-2">
                      <div v-for="(keyword, kIndex) in news.keywords" :key="kIndex" class="tooltip-container relative">
                        <span class="px-2 py-1 text-xs rounded-full cursor-help inline-block" :style="{
                          backgroundColor: `hsl(${keyword.effect >= 0 ? 0 : 120}, ${100 * Math.abs(keyword.effect)}%, 80%)`,
                          color: `hsl(${keyword.effect >= 0 ? 0 : 120}, ${100 * Math.abs(keyword.effect)}%, 20%)`
                        }">
                          {{ keyword.keyword }}
                        </span>
                        <!-- Tooltip 内容 -->
                        <div
                          class="tooltip absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg shadow-lg opacity-0 invisible transition-all duration-200 bg-white text-gray-800 text-xs z-50 max-w-lg w-fit min-w-[150px]">
                          <div class="font-semibold mb-1">{{ keyword.keyword }}</div>
                          <div class="mb-1">
                            <span class="text-gray-600">行情趋势: </span>
                            <span :class="keyword.effect >= 0 ? 'text-red-500' : 'text-green-500'">
                              {{ Math.abs(keyword.effect).toFixed(2) }}
                            </span>
                          </div>
                          <div class="mb-1">
                            <span class="text-gray-600">置信度: </span>
                            <span class="text-blue-500">{{ (keyword.confidence * 100).toFixed(0) }}%</span>
                          </div>
                          <div class="text-gray-700">
                            <span>{{ keyword.reason }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ formatDate(news.date) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No News State -->
            <div v-else class="flex flex-col items-center justify-center py-12 text-center">
              <svg class="w-12 h-12 text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12" y2="16"></line>
              </svg>
              <p class="text-gray-500 font-medium">暂无相关新闻</p>
            </div>
          </div>
        </div>
      </div>
    </main>

  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'

const route = useRoute()

// Tab切换状态
const activeTab = ref<'company' | 'keywords'>('keywords') // 'company' 或 'keywords'

// 获取股票ID
const stockId = computed(() => route.params.id as string)

const calcTagColor = (effect: number) => {
  if (effect >= 0) {
    return `hsl(0, ${Math.min(100, 100 * Math.abs(effect))}%, 80%)`
  } else {
    return `hsl(120, ${Math.min(100, 100 * Math.abs(effect))}%, 80%)`
  }
}

// 格式化日期
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 使用useAsyncData获取股票详情
const { data: stock, pending: isLoading, error, refresh } = useAsyncData(`stock-${stockId.value}`, async () => {
  const { $api } = useNuxtApp()
  const res = await $api("/api/stock/info", {
    query: { id: stockId.value }
  })
  return res.data
})

// 使用useAsyncData获取新闻列表
const { data: newsList, pending: isNewsLoading, error: newsError, refresh: refreshNews } = useAsyncData(`news-${stockId.value}`, async () => {
  const { $api } = useNuxtApp()
  const res = await $api("/api/stock/news/list", {
    query: { id: stockId.value }
  })
  return res.data || []
})

const { data: history } = useAsyncData(`history-${stockId.value}`, async ({ $api }, { signal }) => {
  const res = await $api("/api/stock/history", {
    query: { id: stockId.value },
    signal
  })
  return res.data
})

const { data: newsStatistics } = useAsyncData(async ({ $api }, { signal }) => {
  const res = await $api("/api/stock/news/history", {
    query: { stock_id: stockId.value },
    signal
  })
  return res.data.map(item => ({ time: item.date, value: item.avg_effect }))
})

const { data: keywords } = useAsyncData(async ({ $api }, { signal }) => {
  const res = await $api("/api/stock/news/keywords", {
    query: { stock_id: stockId.value },
    signal
  })
  return res.data
})
</script>

<style scoped>
/* 全局动画定义 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease forwards;
}

/* Tooltip 样式 */
.tooltip-container:hover .tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(-4px);
}

/* Tooltip 三角形指示器 */
.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 4px;
  border-style: solid;
  border-color: white transparent transparent transparent;
}
</style>