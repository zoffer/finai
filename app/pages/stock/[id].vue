<template>
  <div class="stock-detail-container">
    <header class="page-header">
      <div class="header-content">
        <div class="header-text">
          <button @click="goBack" class="back-button">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="15" y1="18" x2="9" y2="12"></line>
              <line x1="9" y1="6" x2="15" y2="12"></line>
            </svg>
            返回列表
          </button>
          <h1>{{ stock?.name || '股票详情' }}</h1>
          <p class="subtitle">{{ stock?.symbol }} - {{ stock?.exchange }}</p>
        </div>
        <div class="header-info">
          <span class="update-time">{{ lastUpdateTime }}</span>
        </div>
      </div>
    </header>
    
    <main class="main-content">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中，请稍候...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <svg class="error-icon" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12" y2="16"></line>
        </svg>
        <p>{{ error }}</p>
        <button @click="refresh()" class="retry-button">重试</button>
      </div>

      <!-- 股票详情内容 -->
      <div v-else-if="stock" class="stock-detail-content">
        <!-- 基本信息卡片 -->
        <div class="info-card">
          <div class="price-section">
            <div class="current-price">
              ¥{{ formatPrice(stock.price) }}
            </div>
            <div :class="['price-change', stock.change > 0 ? 'positive' : 'negative']">
              <span class="change-indicator">
                <svg v-if="stock.change > 0" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 13.5 13.5 8.5 8.5 1 16"></polyline>
                  <polyline points="17 14 23 20 23 14"></polyline>
                </svg>
                <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 16 13.5 6.5 8.5 11.5 1 4"></polyline>
                  <polyline points="17 10 23 4 23 10"></polyline>
                </svg>
              </span>
              {{ stock.change > 0 ? '+' : '' }}{{ stock.change.toFixed(2) }}% ({{ formatPrice(stock.changeAmount) }})
            </div>
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">开盘价</div>
              <div class="stat-value">¥{{ formatPrice(stock.open) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">最高价</div>
              <div class="stat-value">¥{{ formatPrice(stock.high) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">最低价</div>
              <div class="stat-value">¥{{ formatPrice(stock.low) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">成交量</div>
              <div class="stat-value">{{ formatVolume(stock.volume) }}</div>
            </div>
          </div>
        </div>

        <!-- 公司信息卡片 -->
        <div class="info-card">
          <h2 class="section-title">公司信息</h2>
          <div class="company-info">
            <div class="info-row">
              <span class="info-label">公司名称</span>
              <span class="info-value">{{ stock.name }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">股票代码</span>
              <span class="info-value">{{ stock.symbol }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">交易所</span>
              <span class="info-value">{{ stock.exchange }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">行业</span>
              <span class="info-value">{{ stock.industry || '-' }}</span>
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

// 格式化成交量
const formatVolume = (volume: number | null | undefined) => {
  if (volume === null || volume === undefined) return '0'
  if (volume >= 1000000) {
    return (volume / 1000000).toFixed(2) + 'M'
  } else if (volume >= 1000) {
    return (volume / 1000).toFixed(2) + 'K'
  }
  return volume.toString()
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
    query: { symbol: stockId.value }
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
}, { 
  default() {
    return {
      id: stockId.value,
      symbol: '-',
      name: '-',
      exchange: '-',
      price: 0,
      change: 0,
      changeAmount: 0,
      open: 0,
      high: 0,
      low: 0,
      volume: 0,
      industry: "-"
    }
  },
})

// 返回上一页
const goBack = (): void => {
  router.back()
}
</script>

<style scoped lang="scss">
// 全局动画定义
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

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.stock-detail-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-text {
      display: flex;
      align-items: center;
      gap: 1rem;

      .back-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);

        &:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }
      }

      h1 {
        font-size: 1.8rem;
        margin: 0;
        font-weight: 700;
        letter-spacing: -0.5px;
      }

      .subtitle {
        font-size: 0.95rem;
        margin: 0.25rem 0 0 0;
        opacity: 0.9;
        font-weight: 300;
      }
    }

    .header-info {
      .update-time {
        font-size: 0.875rem;
        opacity: 0.8;
        background: rgba(255, 255, 255, 0.1);
        padding: 0.5rem 0.75rem;
        border-radius: 20px;
        backdrop-filter: blur(10px);
      }
    }
  }
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

// 加载状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  p {
    color: #6c757d;
    font-size: 1rem;
    margin: 0;
  }
}

// 错误状态
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;

  .error-icon {
    color: #dc3545;
    margin-bottom: 1rem;
  }

  p {
    color: #6c757d;
    font-size: 1rem;
    margin: 0 0 1.5rem 0;
  }

  .retry-button {
    padding: 0.75rem 1.5rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #5a67d8;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
  }
}

// 股票详情内容
.stock-detail-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: fadeIn 0.5s ease forwards;
}

// 信息卡片
.info-card {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
  }
}

// 价格区域
.price-section {
  text-align: center;
  margin-bottom: 2rem;

  .current-price {
    font-size: 3rem;
    font-weight: 700;
    color: #212529;
    margin-bottom: 0.5rem;
  }

  .price-change {
    font-size: 1.2rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;

    &.positive {
      color: #dc3545; /* 红色 - 中国股市上涨颜色 */
    }

    &.negative {
      color: #28a745; /* 绿色 - 中国股市下跌颜色 */
    }
  }
}

// 统计数据网格
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: #e9ecef;
    transform: translateY(-2px);
  }

  .stat-label {
    display: block;
    font-size: 0.9rem;
    color: #6c757d;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .stat-value {
    display: block;
    font-size: 1.3rem;
    font-weight: 700;
    color: #495057;
  }
}

// 部分标题
.section-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #495057;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f0f0f0;
}

// 公司信息
.company-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f8f9fa;

  &:last-child {
    border-bottom: none;
  }

  .info-label {
    font-size: 0.95rem;
    color: #6c757d;
    font-weight: 500;
  }

  .info-value {
    font-size: 1rem;
    color: #495057;
    font-weight: 600;
  }
}
</style>