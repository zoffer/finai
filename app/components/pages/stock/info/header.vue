<template>
    <header class="text-white shadow-lg sticky top-0 z-50" :class="[
        stock.change > 0 ? 'bg-gradient-to-r from-red-500 to-red-600' :
            stock.change < 0 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                'bg-gradient-to-r from-gray-600 to-gray-700'
    ]">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div class="flex justify-between items-center">
                <!-- 左侧信息：返回按钮 + 股票基本信息 -->
                <div class="flex items-center gap-3">
                    <button @click="goBack"
                        class="flex items-center justify-center p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                        aria-label="返回列表">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <div>
                        <h1 class="text-xl md:text-2xl font-bold">{{ stock.name || '股票详情' }}</h1>
                        <p class="text-xs md:text-sm opacity-90 mt-0.5">{{ stock.symbol }} - {{ stock.exchange }}</p>
                    </div>
                </div>

                <!-- 右侧价格信息 -->
                <div class="flex flex-col items-end gap-2">
                    <!-- 当前价格 -->
                    <div class="text-2xl md:text-3xl font-bold">
                        ¥{{ stock.price }}
                    </div>
                    <!-- 涨跌幅 -->
                    <div class="flex items-center justify-center gap-2 text-sm font-semibold">
                        {{ stock.change_percent > 0 ? '+' : '' }}{{ stock.change_percent.toFixed(2) }}%
                        <span class="opacity-25">|</span>
                        {{ stock.change > 0 ? '+' : '' }}{{ stock.change.toFixed(2) }}
                    </div>
                </div>
            </div>

            <!-- 统计信息 -->
            <div class="flex justify-between gap-y-1 gap-x-4 mt-2 text-sm opacity-95">
                <span class="text-center">
                    <span class="opacity-75 block sm:inline mx-1">开盘</span>
                    <span class="text-nowrap"> ¥{{ stock.open }} </span>
                </span>
                <span class="text-center">
                    <span class="opacity-75 block sm:inline mx-1">最高</span>
                    <span class="text-nowrap"> ¥{{ stock.high }} </span>
                </span>
                <span class="text-center">
                    <span class="opacity-75 block sm:inline mx-1">最低</span>
                    <span class="text-nowrap"> ¥{{ stock.low }} </span>
                </span>
                <span class="text-center">
                    <span class="opacity-75 block sm:inline mx-1">成交</span>
                    <span class="text-nowrap"> ¥{{ formatLargeNumber(stock.turnover) }} </span>
                </span>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { formatLargeNumber } from '@/utils/format/number'

const defaultStock = {
    id: '',
    name: '--',
    symbol: '--',
    exchange: '--',
    price: 0,
    open: 0,
    high: 0,
    low: 0,
    change: 0,
    change_percent: 0,
    turnover: 0,
    volume: 0,
}

type Stock = typeof defaultStock

const props = defineProps<{
    data?: Stock
}>()

const stock = computed(() => props.data || defaultStock)

const router = useRouter()
// 返回上一页
const goBack = () => router.back()
</script>