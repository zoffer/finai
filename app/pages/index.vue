<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
    <!-- Header -->
    <header class="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-4"></div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Search and Filter Section -->
      <div class="bg-white rounded-2xl shadow-xl p-6 mb-8 transition-all duration-300 hover:shadow-2xl">
        <div class="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <!-- Search Box -->
          <div class="relative flex-1 max-w-md">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="搜索股票代码或名称..."
              class="block w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none text-sm font-medium transition-all duration-200 bg-gray-50 focus:bg-white"
            />
            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          <!-- Filter Controls -->
          <div class="flex flex-col sm:flex-row gap-3">
            <!-- Refresh Button -->
            <button 
              @click="refreshData()" 
              :disabled="isLoading"
              class="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <svg v-if="!isLoading" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              <svg v-else class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
              刷新数据
            </button>
          </div>
        </div>
      </div>

      <!-- Stock Table -->
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 px-4">
          <div class="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p class="text-gray-600 font-medium">加载中，请稍候...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredStocks.length === 0" class="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div class="w-20 h-20 text-gray-300 mb-4">
            <svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <p class="text-gray-600 font-medium text-lg">{{ searchQuery ? '没有找到匹配的股票' : '暂无股票数据' }}</p>
        </div>

        <!-- Stock Table -->
        <table v-else class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                股票代码
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                股票名称
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                当前价格
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                涨跌幅
              </th>
              <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                成交额
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-100">
            <tr 
              v-for="(stock, i) in filteredStocks" 
              :key="stock.symbol" 
              class="group transition-all duration-300 hover:bg-gray-50 cursor-pointer"
              :style="{ animationDelay: `${getAnimationDelay(i)}ms` }"
              @click="goToDetail(stock.symbol)"
            >
              <td class="px-6 py-5 whitespace-nowrap">
                <div class="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {{ stock.symbol }}
                </div>
              </td>
              <td class="px-6 py-5 whitespace-nowrap">
                <div class="text-sm text-gray-600">
                  {{ stock.name }}
                </div>
              </td>
              <td class="px-6 py-5 whitespace-nowrap">
                <div class="text-sm font-bold text-gray-900">
                  ¥{{ stock.price.toFixed(2) }}
                </div>
              </td>
              <td class="px-6 py-5 whitespace-nowrap">
                <div :class="['flex items-center gap-2 text-sm font-bold', stock.change > 0 ? 'text-red-500' : 'text-green-500']">
                  <span>
                    <svg v-if="stock.change > 0" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="23 4 13.5 13.5 8.5 8.5 1 16"></polyline>
                      <polyline points="17 14 23 20 23 14"></polyline>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="23 16 13.5 6.5 8.5 11.5 1 4"></polyline>
                      <polyline points="17 10 23 4 23 10"></polyline>
                    </svg>
                  </span>
                  {{ stock.change > 0 ? '+' : '' }}{{ stock.change.toFixed(2) }}%
                </div>
              </td>
              <td class="px-6 py-5 whitespace-nowrap">
                <div class="text-sm text-gray-500 font-mono">
                  {{ formatVolume(stock.turnover) }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <p class="text-sm text-gray-400 mb-4 md:mb-0">
            © 2024 FinAI 金融智能平台
          </p>
          <div class="flex gap-6">
            <a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">
              关于我们
            </a>
            <a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">
              隐私政策
            </a>
            <a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">
              服务条款
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const { $api } = useNuxtApp()

// 股票数据状态
const searchQuery = ref('')

// 格式化成交量（符合中文习惯）
const formatVolume = (volume: number) => {
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(2) + '亿'
  } else if (volume >= 10000) {
    return (volume / 10000).toFixed(2) + '万'
  }
  return volume.toString()
}

// 计算过滤后的股票数据
const filteredStocks = computed(() => {
  let result = stocks.value ? stocks.value : []
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(stock => 
      stock.symbol.toLowerCase().includes(query) || 
      stock.name.toLowerCase().includes(query)
    )
  }
  
  return result
})

// 获取动画延迟，创建交错效果
const getAnimationDelay = (index: number) => {
  return index * 30
}

const { data: stocks, pending: isLoading, refresh: refreshData } = useAsyncData(async () => {
  const res = await $api("/api/stock/list/hot", {
    query: { size: 100 }
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
})

// 跳转到详情页面
const router = useRouter()
const goToDetail = (symbol: string) => {
  router.push(`/stock/${symbol}`)
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

/* 为表格行添加动画类 */
tr {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.5s ease forwards;
}
</style>