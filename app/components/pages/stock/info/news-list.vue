<template>
    <div class="bg-bg rounded-2xl shadow-sm transition-all duration-300">
        <div class="p-6">
            <h2 class="text-xl font-bold text-text mb-4 pb-2 border-b-2 border-border">24H新闻</h2>

            <div v-if="pending" class="flex flex-col items-center justify-center py-12">
                <div class="w-12 h-12 border-4 border-secondary border-t-primary rounded-full animate-spin mb-4">
                </div>
                <p class="text-text font-medium">加载新闻中...</p>
            </div>

            <div v-else-if="error" class="flex flex-col items-center justify-center py-12 text-center">
                <svg class="w-12 h-12 text-error mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12" y2="16"></line>
                </svg>
                <p class="text-text font-medium mb-4">加载新闻失败</p>
                <button @click="refresh()"
                    class="px-4 py-2 bg-primary text-text rounded-lg hover:bg-primary/80 transition-colors">
                    重试
                </button>
            </div>

            <div v-else-if="data && data.length > 0" class="space-y-4">
                <div v-for="(news, index) in data" :key="news.id"
                    class="p-4 border border-border rounded-xl hover:border-primary transition-all duration-200">
                    <div class="flex flex-col md:flex-row md:items-start gap-4">
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-text transition-colors mb-2 line-clamp-2">
                                {{ news.title }}
                            </h3>
                            <p class="text-text-muted text-sm mb-3">
                                {{ news.content }}
                            </p>
                            <div v-if="news.keywords && news.keywords.length > 0" class="mb-2 flex flex-wrap gap-2">
                                <Tooltip v-for="(keyword, kIndex) in news.keywords" :key="kIndex">
                                    <span
                                        class="px-2 py-1 text-xs rounded-full cursor-help inline-block bg-secondary text-bg-surface">
                                        {{ keyword.keyword }}
                                    </span>
                                    <template #tooltip-content>
                                        <div class="w-fit min-w-[150px]">
                                            <div>
                                                <span class="text-text-muted">行情趋势: </span>
                                                <span :class="keyword.effect >= 0 ? 'text-up' : 'text-down'">
                                                    {{ Math.abs(keyword.effect).toFixed(2) }}
                                                </span>
                                            </div>
                                            <div class="mb-1">
                                                <span class="text-text-muted">置信度: </span>
                                                <span class="text-accent">{{ (keyword.confidence * 100).toFixed(0)
                                                }}%</span>
                                            </div>
                                            <div class="text-text">
                                                <span>{{ keyword.reason }}</span>
                                            </div>
                                        </div>
                                    </template>
                                </Tooltip>
                            </div>
                            <div class="text-xs text-text-muted/70">
                                {{ formatDate(news.date) }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="flex flex-col items-center justify-center py-12 text-center">
                <svg class="w-12 h-12 text-text-muted/50 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12" y2="16"></line>
                </svg>
                <p class="text-text-muted font-medium">暂无相关新闻</p>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import Tooltip from './tooltip.vue'
const props = defineProps<{
    stockId: string
}>()
const { data, pending, error, refresh } = useAsyncData(`news-${props.stockId}`, async ({ $api }, { signal }) => {
    const res = await $api("/api/stock/news/list", {
        query: { id: props.stockId },
        signal
    })
    return res.data
})

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
