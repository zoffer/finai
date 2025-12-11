<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Header -->
    <header class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div class="flex items-center gap-4">
            <button @click="goBack"
              class="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 backdrop-blur-sm font-medium">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="15" y1="18" x2="9" y2="12"></line>
                <line x1="9" y1="6" x2="15" y2="12"></line>
              </svg>
              返回列表
            </button>
            <div>
              <h1 class="text-2xl md:text-3xl font-bold">{{ stock?.name || '股票详情' }}</h1>
              <p class="text-sm md:text-base opacity-90 mt-1">{{ stock?.symbol }} - {{ stock?.exchange }}</p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <div v-else-if="stock" class="space-y-8 animate-fadeIn">
        <!-- Price Info Card -->
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <div class="p-8">
            <!-- Price Section -->
            <div class="text-center mb-8">
              <div class="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                ¥{{ formatPrice(stock.price) }}
              </div>
              <div
                :class="['flex items-center justify-center gap-2 text-xl font-semibold', stock.change > 0 ? 'text-red-500' : 'text-green-500']">
                <span>
                  <svg v-if="stock.change > 0" viewBox="0 0 24 24" width="20" height="20" fill="none"
                    stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 13.5 13.5 8.5 8.5 1 16"></polyline>
                    <polyline points="17 14 23 20 23 14"></polyline>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
                    stroke-width="2">
                    <polyline points="23 16 13.5 6.5 8.5 11.5 1 4"></polyline>
                    <polyline points="17 10 23 4 23 10"></polyline>
                  </svg>
                </span>
                {{ stock.change > 0 ? '+' : '' }}{{ stock.change.toFixed(2) }}% (¥{{ formatPrice(stock.changeAmount) }})
              </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div class="text-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200">
                <div class="text-sm font-medium text-gray-600 mb-2">开盘价</div>
                <div class="text-2xl font-bold text-gray-900">¥{{ formatPrice(stock.open) }}</div>
              </div>
              <div class="text-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200">
                <div class="text-sm font-medium text-gray-600 mb-2">最高价</div>
                <div class="text-2xl font-bold text-gray-900">¥{{ formatPrice(stock.high) }}</div>
              </div>
              <div class="text-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200">
                <div class="text-sm font-medium text-gray-600 mb-2">最低价</div>
                <div class="text-2xl font-bold text-gray-900">¥{{ formatPrice(stock.low) }}</div>
              </div>
              <div class="text-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200">
                <div class="text-sm font-medium text-gray-600 mb-2">成交额</div>
                <div class="text-2xl font-bold text-gray-900">{{ formatVolume(stock.turnover) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Company Info Card -->
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <div class="p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-100">公司信息</h2>
            <div>
              {{ stock.introduction || '-' }}
            </div>
          </div>
        </div>

        <!-- News List Card -->
        <div class="bg-white rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl">
          <div class="p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-100">相关新闻</h2>

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
                            <span class="text-gray-600">影响程度: </span>
                            <span :class="keyword.effect >= 0 ? 'text-red-500' : 'text-green-500'">
                              {{ keyword.effect >= 0 ? '利好' : '利空' }} ({{ Math.abs(keyword.effect).toFixed(2) }})
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
import { useRoute, useRouter } from 'vue-router'
import { useAsyncData } from 'nuxt/app'
import { useNuxtApp } from '#app'

const route = useRoute()
const router = useRouter()
const lastUpdateTime = ref('')

// 获取股票ID
const stockId = computed(() => route.params.id as string)

// 格式化价格
const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined) return '0.00'
  return price.toFixed(2)
}

// 格式化成交量（符合中文习惯）
const formatVolume = (volume: number | null | undefined) => {
  if (volume === null || volume === undefined) return '0'
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(2) + '亿'
  } else if (volume >= 10000) {
    return (volume / 10000).toFixed(2) + '万'
  }
  return volume.toString()
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

// 更新最后更新时间
const updateLastUpdateTime = (): void => {
  const now = new Date()
  lastUpdateTime.value = `最后更新: ${now.toLocaleTimeString('zh-CN')}`
}

// 使用useAsyncData获取股票详情
const { data: stock, pending: isLoading, error, refresh } = useAsyncData(`stock-${stockId.value}`, async () => {
  const { $api } = useNuxtApp()
  const res = await $api("/api/stock/info", {
    query: { id: stockId.value }
  })

  // 计算涨跌幅
  const stockData = res.data
  const currentPrice = stockData?.price || 0
  const openPrice = stockData?.open || 0
  const change = openPrice > 0 ? ((currentPrice - openPrice) / openPrice * 100) : 0
  const changeAmount = currentPrice - openPrice

  // 更新最后更新时间
  updateLastUpdateTime()

  return {
    ...stockData,
    change: parseFloat(change.toFixed(2)),
    changeAmount: parseFloat(changeAmount.toFixed(2)),
  }
})

// 使用useAsyncData获取新闻列表
const { data: newsList, pending: isNewsLoading, error: newsError, refresh: refreshNews } = useAsyncData(`news-${stockId.value}`, async () => {
  const { $api } = useNuxtApp()
  const res = await $api("/api/stock/news/list", {
    query: { id: stockId.value }
  })
  return res.data || []
})

// 返回上一页
const goBack = (): void => {
  router.back()
}
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