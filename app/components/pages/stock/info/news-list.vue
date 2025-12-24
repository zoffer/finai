<template>
    <div class="bg-white rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl">
        <div class="p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-100">24H新闻</h2>

            <!-- News Loading State -->
            <div v-if="pending" class="flex flex-col items-center justify-center py-12">
                <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4">
                </div>
                <p class="text-gray-600 font-medium">加载新闻中...</p>
            </div>

            <!-- News Error State -->
            <div v-else-if="error" class="flex flex-col items-center justify-center py-12 text-center">
                <svg class="w-12 h-12 text-red-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12" y2="16"></line>
                </svg>
                <p class="text-gray-600 font-medium mb-4">加载新闻失败</p>
                <button @click="refresh()"
                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    重试
                </button>
            </div>

            <!-- News List -->
            <div v-else-if="data && data.length > 0" class="space-y-4">
                <div v-for="(news, index) in data" :key="news.id"
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
                                <Tooltip v-for="(keyword, kIndex) in news.keywords" :key="kIndex">
                                    <span class="px-2 py-1 text-xs rounded-full cursor-help inline-block" :style="{
                                        backgroundColor: `hsl(${keyword.effect >= 0 ? 0 : 120}, ${100 * Math.abs(keyword.effect)}%, 80%)`,
                                        color: `hsl(${keyword.effect >= 0 ? 0 : 120}, ${100 * Math.abs(keyword.effect)}%, 20%)`
                                    }">
                                        {{ keyword.keyword }}
                                    </span>
                                    <template #tooltip-content>
                                        <div class="w-fit min-w-[150px]">
                                            <div>
                                                <span class="text-gray-600">行情趋势: </span>
                                                <span :class="keyword.effect >= 0 ? 'text-red-500' : 'text-green-500'">
                                                    {{ Math.abs(keyword.effect).toFixed(2) }}
                                                </span>
                                            </div>
                                            <div class="mb-1">
                                                <span class="text-gray-600">置信度: </span>
                                                <span class="text-blue-500">{{ (keyword.confidence * 100).toFixed(0)
                                                    }}%</span>
                                            </div>
                                            <div class="text-gray-700">
                                                <span>{{ keyword.reason }}</span>
                                            </div>
                                        </div>
                                    </template>
                                </Tooltip>
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
</template>

<script lang="ts" setup>
import Tooltip from './tooltip.vue'
const props = defineProps<{
    stockId: string
}>()
// 使用useAsyncData获取新闻列表
const { data, pending, error, refresh } = useAsyncData(`news-${props.stockId}`, async ({ $api }, { signal }) => {
    const res = await $api("/api/stock/news/list", {
        query: { id: props.stockId },
        signal
    })
    return res.data
})

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
</script>