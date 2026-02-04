<template>
    <div class="bg-bg rounded-2xl shadow-sm transition-all duration-300">
        <div class="flex border-b border-border">
            <button @click="activeTab = 'keywords'"
                class="px-6 py-3 text-sm font-medium transition-all duration-200 flex-1 text-center relative -mb-px"
                :class="[
                    activeTab === 'keywords'
                        ? 'text-primary border-b-2 border-primary font-semibold'
                        : 'text-text-muted hover:text-text hover:bg-bg-surface'
                ]">
                关键词
            </button>
            <button @click="activeTab = 'company'"
                class="px-6 py-3 text-sm font-medium transition-all duration-200 flex-1 text-center relative -mb-px"
                :class="[
                    activeTab === 'company'
                        ? 'text-primary border-b-2 border-primary font-semibold'
                        : 'text-text-muted hover:text-text hover:bg-bg-surface'
                ]">
                公司信息
            </button>
        </div>

        <div class="p-6">
            <div v-if="activeTab === 'company'">
                <div>
                    {{ introduction || '-' }}
                </div>
            </div>

            <div v-else-if="activeTab === 'keywords'">
                <div v-if="keywords && keywords.length > 0" class="flex flex-wrap gap-3">
                    <Tooltip v-for="(item, index) in keywords" :key="index">
                        <span
                            class="px-3 py-1.5 text-sm rounded-full cursor-help inline-block bg-secondary text-bg-surface">
                            {{ item.keyword }}
                        </span>
                        <template #tooltip-content>
                            <div class="w-max">
                                <span class="text-text-muted">行情趋势: </span>
                                <span
                                    :class="{ 'text-up': item.avg_effect > 0, 'text-down': item.avg_effect < 0, 'text-text-muted': item.avg_effect === 0 }">
                                    {{ item.avg_effect.toFixed(2) }}
                                </span>
                            </div>
                            <div>
                                <span class="text-text-muted">新闻热度: </span>
                                <span class="text-accent">{{ item.news_count }}</span>
                            </div>
                            <div>
                                <span class="text-text-muted">关联度: </span>
                                <span class="text-accent">{{ item.weight.toFixed(2) }}</span>
                            </div>
                        </template>
                    </Tooltip>
                </div>
                <div v-else class="text-text-muted text-center py-4">
                    暂无关键词数据
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import Tooltip from './tooltip.vue'
const props = defineProps<{
    introduction?: string
    stockId?: string
}>()

const activeTab = ref<'company' | 'keywords'>('keywords')

const { data: keywords } = useAsyncData(async ({ $api }, { signal }) => {
    const res = await $api("/api/stock/news/keywords", {
        query: { stock_id: props.stockId },
        signal
    })
    return res.data
})

const calcTagColor = (effect: number) => {
    if (effect >= 0) {
        return `hsl(0, ${Math.min(100, 100 * Math.abs(effect))}%, 80%)`
    } else {
        return `hsl(120, ${Math.min(100, 100 * Math.abs(effect))}%, 80%)`
    }
}
</script>
