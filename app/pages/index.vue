<template>
  <div class="stock-list-container">
    <header class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1>股票市场行情</h1>
          <p class="subtitle">实时跟踪您关注的股票</p>
        </div>
      </div>
    </header>
    
    <main class="main-content">
      <!-- 搜索和筛选区域 -->
      <div class="search-filter-section">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索股票代码或名称..."
            class="search-input"
          />
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <div class="filter-controls">
          <select v-model="sortBy" class="filter-select">
            <option value="symbol">按代码排序</option>
            <option value="change">按涨跌幅排序</option>
            <option value="price">按价格排序</option>
          </select>
          <button @click="refreshData()" class="refresh-btn" :disabled="isLoading">
            <svg v-if="!isLoading" class="refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <svg v-else class="loading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
      
      
      <!-- 股票表格 -->
      <div class="stock-table-wrapper">
        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载中，请稍候...</p>
        </div>

        <!-- 无数据状态 -->
        <div v-else-if="filteredStocks.length === 0" class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <p>{{ searchQuery ? '没有找到匹配的股票' : '暂无股票数据' }}</p>
        </div>

        <!-- 股票表格 -->
        <table v-else class="stock-table">
          <thead>
            <tr>
              <th> 股票代码 </th>
              <th>股票名称</th>
              <th> 当前价格 </th>
              <th> 涨跌幅 </th>
              <th>成交额</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="stock, i in filteredStocks" 
              :key="stock.symbol" 
              class="stock-row animate-in"
              :style="{ animationDelay: `${getAnimationDelay(i)}ms` }"
              @click="goToDetail(stock.symbol)"
              :class="{ 'clickable-row': true }"
            >
              <td class="symbol">{{ stock.symbol }}</td>
              <td class="name">{{ stock.name }}</td>
              <td class="price">¥{{ stock.price.toFixed(2) }}</td>
              <td :class="['change', stock.change > 0 ? 'positive' : 'negative']">
                <span class="change-indicator">
                  <svg v-if="stock.change > 0" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 13.5 13.5 8.5 8.5 1 16"></polyline>
                    <polyline points="17 14 23 20 23 14"></polyline>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 16 13.5 6.5 8.5 11.5 1 4"></polyline>
                    <polyline points="17 10 23 4 23 10"></polyline>
                  </svg>
                </span>
                {{ stock.change > 0 ? '+' : '' }}{{ stock.change.toFixed(2) }}%
              </td>
              <td class="volume">{{ formatVolume(stock.turnover) }}</td>
            </tr>
          </tbody>
      </table>
      

    </div>
  </main>
    
    <footer class="page-footer">
      <div class="footer-content">
        <p>© 2024 FinAI 金融智能平台</p>
        <div class="footer-links">
          <a href="#">关于我们</a>
          <a href="#">隐私政策</a>
          <a href="#">服务条款</a>
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
const sortBy = ref('symbol')

// 格式化成交量
const formatVolume = (volume: number) => {
  if (volume >= 1000000) {
    return (volume / 1000000).toFixed(2) + 'M'
  } else if (volume >= 1000) {
    return (volume / 1000).toFixed(2) + 'K'
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

<style scoped lang="scss">
// 全局动画定义
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

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.stock-list-container {
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

    .header-text h1 {
      font-size: 2rem;
      margin: 0 0 0.25rem 0;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .subtitle {
      font-size: 1rem;
      margin: 0;
      opacity: 0.9;
      font-weight: 300;
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

// 搜索和筛选区域
.search-filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;

  .search-box {
    position: relative;
    flex: 1;
    max-width: 400px;

    .search-input {
      width: 100%;
      padding: 0.75rem 2.5rem 0.75rem 1rem;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      font-size: 0.95rem;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
    }

    .search-icon {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      color: #6c757d;
    }
  }

  .filter-controls {
    display: flex;
    gap: 0.75rem;
    align-items: center;

    .filter-select {
      padding: 0.75rem 1rem;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      font-size: 0.95rem;
      background: white;
      cursor: pointer;
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        background: #5a67d8;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }

      &:disabled {
        background: #adb5bd;
        cursor: not-allowed;
        transform: none;
      }

      .refresh-icon,
      .loading-icon {
        width: 16px;
        height: 16px;
      }

      .loading-icon {
        animation: spin 1s linear infinite;
      }
    }
  }
}

// 股票表格
.stock-table-wrapper {
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  min-height: 400px;
}

.stock-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;

  thead {
    background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%);
    position: sticky;
    top: 0;
    z-index: 10;

    th {
      padding: 1.2rem 1rem;
      text-align: left;
      font-weight: 600;
      color: #495057;
      border-bottom: 2px solid #dee2e6;
      position: relative;

      &.sortable-header {
        cursor: pointer;
        user-select: none;
        transition: all 0.2s ease;

        &:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }

        .sort-icon {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
        }
      }
    }
  }

  tbody {
    .stock-row {
      transition: all 0.3s ease;
      border-bottom: 1px solid #f8f9fa;

      &:hover {
        background-color: #f8f9fa;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      &.clickable-row {
        cursor: pointer;
      }

      &.animate-in {
        animation: fadeInUp 0.5s ease forwards;
      }

      td {
        padding: 1rem;
        vertical-align: middle;
      }

      .symbol {
        font-weight: 600;
        color: #495057;
        font-size: 1rem;
      }

      .name {
        color: #6c757d;
      }

      .price {
        font-weight: 600;
        color: #212529;
        font-size: 1rem;
      }

      .change {
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.25rem;

        &.positive {
          color: #dc3545; /* 红色 - 中国股市上涨颜色 */
        }

        &.negative {
          color: #28a745; /* 绿色 - 中国股市下跌颜色 */
        }

        .change-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .volume {
        color: #6c757d;
        font-family: 'Courier New', monospace;
      }
    }
  }
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

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;

  .empty-icon {
    width: 64px;
    height: 64px;
    color: #adb5bd;
    margin-bottom: 1rem;
  }

  p {
    color: #6c757d;
    font-size: 1rem;
    margin: 0;
  }
}

// 分页控件
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
  background-color: #f8f9fa;

  .pagination-info {
    color: #6c757d;
    font-size: 0.9rem;
  }

  .pagination-buttons {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .pagination-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      background-color: white;
      color: #495057;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background-color: #667eea;
        color: white;
        border-color: #667eea;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
      }

      &:disabled {
        background-color: #f8f9fa;
        color: #adb5bd;
        cursor: not-allowed;
        transform: none;
      }

      &.page-btn {
        min-width: 36px;
        height: 36px;
        padding: 0.5rem;

        &.active {
          background-color: #667eea;
          color: white;
          border-color: #667eea;
          font-weight: 600;
        }
      }
    }
    
    // 省略号样式
    .pagination-ellipsis {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      color: #6c757d;
      font-size: 0.9rem;
    }
  }
}

// 响应式分页控件
@media (max-width: 768px) {
  .pagination-controls {
    flex-direction: column;
    gap: 1rem;
    text-align: center;

    .pagination-buttons {
      flex-wrap: wrap;
      justify-content: center;

      .pagination-btn {
        font-size: 0.85rem;
        padding: 0.4rem 0.6rem;

        &.page-btn {
          min-width: 32px;
          height: 32px;
        }
      }
    }
  }
}

// 页脚
.page-footer {
  background: linear-gradient(135deg, #343a40 0%, #212529 100%);
  color: white;
  padding: 2rem 0;
  margin-top: auto;

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;

    p {
      margin: 0;
      opacity: 0.8;
      font-size: 0.9rem;
    }

    .footer-links {
      display: flex;
      gap: 1.5rem;

      a {
        color: white;
        text-decoration: none;
        opacity: 0.7;
        font-size: 0.9rem;
        transition: opacity 0.3s ease;

        &:hover {
          opacity: 1;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 1.25rem 0;

    .header-content {
      flex-direction: column;
      gap: 1rem;
      text-align: center;

      .header-text h1 {
        font-size: 1.75rem;
      }
    }
  }

  .main-content {
    padding: 1rem;
  }

  .search-filter-section {
    flex-direction: column;
    align-items: stretch;

    .filter-controls {
      flex-direction: column;
      align-items: stretch;

      .filter-select,
      .refresh-btn {
        width: 100%;
      }
    }
  }

  .stats-cards {
    grid-template-columns: 1fr 1fr;
  }

  .stock-table {
    font-size: 0.85rem;

    thead th,
    tbody td {
      padding: 0.8rem 0.5rem;
    }

    .change-indicator svg {
      display: none;
    }
  }

  .footer-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;

    .footer-links {
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem;
    }
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .stock-table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}
</style>