<template>
    <table class="w-full divide-y divide-gray-200 table-fixed">
        <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
                <th scope="col"
                    class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 sticky left-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100">
                    股票
                </th>

                <th scope="col" class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700">
                    涨跌/现价
                </th>
                <th scope="col" class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700">
                    成交
                </th>
                <th scope="col" class="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700">
                    新闻
                </th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
            <tr v-for="(stock, i) in stocks || []" :key="stock.id"
                class="hover:bg-gray-50 cursor-pointer active:bg-gray-100" @click="emit('item-click', stock)">
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
                    <div class="flex items-center gap-1 sm:gap-2 text-sm font-bold"
                        :class="[stock.change > 0 ? 'text-red-500' : 'text-green-500']">
                        {{ stock.change > 0 ? '+' : '' }}{{ stock.change_percent.toFixed(2) }}%
                    </div>
                    <div class="text-sm font-bold text-gray-900 mt-1">
                        ¥{{ stock.price.toFixed(2) }}
                    </div>
                </td>
                <td class="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                    <div class="text-sm text-gray-500 font-mono">
                        ¥{{ formatLargeNumber(stock.turnover) }}
                    </div>
                </td>
                <td class="px-3 sm:px-6 py-4 sm:py-5 whitespace-nowrap">
                    <div class="flex items-center gap-1 sm:gap-2 text-sm font-bold"
                        :class="[stock.sum_effect > 0 ? 'text-red-500' : stock.sum_effect < 0 ? 'text-green-500' : 'text-gray-500']">
                        <span>
                            <svg v-if="stock.sum_effect > 0" viewBox="0 0 24 24" width="14" height="14" fill="none"
                                stroke="currentColor" stroke-width="2">
                                <polyline points="23 4 13.5 13.5 8.5 8.5 1 16"></polyline>
                            </svg>
                            <svg v-else-if="stock.sum_effect < 0" viewBox="0 0 24 24" width="14" height="14" fill="none"
                                stroke="currentColor" stroke-width="2">
                                <polyline points="23 16 13.5 6.5 8.5 11.5 1 4"></polyline>
                            </svg>
                        </span>
                        {{ stock.sum_effect ? stock.sum_effect.toFixed(2) : '0.00' }}
                    </div>
                    <div class="flex items-center gap-1 sm:gap-2 text-sm font-medium text-blue-600 mt-1">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        {{ stock.news_count || 0 }}
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
</template>

<script lang="ts" setup>
import { formatLargeNumber } from '@/utils/format/number'

type Stock = {
    id: string;
    name: string;
    symbol: string;
    price: number;
    sum_effect: number;
    turnover: number;
    news_count: number;
    open: number;
    high: number;
    low: number;
    change: number;
    change_percent: number;
}
const props = defineProps<{
    data?: Stock[]
}>()

const stocks = computed(() => props.data || [])

const emit = defineEmits<{
    (e: 'item-click', stock: Stock): void
}>()

</script>