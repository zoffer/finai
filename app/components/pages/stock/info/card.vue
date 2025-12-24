<template>
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
                    {{ introduction || '-' }}
                </div>
            </div>

            <!-- Keywords Tab -->
            <div v-else-if="activeTab === 'keywords'">
                <div v-if="keywords && keywords.length > 0" class="flex flex-wrap gap-3">
                    <Tooltip v-for="(item, index) in keywords" :key="index">
                        <span class="px-3 py-1.5 text-sm rounded-full cursor-help inline-block text-gray-600" :style="{
                            backgroundColor: calcTagColor(item.avg_effect),
                            color: `hsl(${item.avg_effect >= 0 ? 0 : 120}, ${100 * Math.abs(item.avg_effect)}%, 20%)`
                        }">
                            {{ item.keyword }}
                        </span>
                        <template #tooltip-content>
                            <div class="w-max">
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
                        </template>
                    </Tooltip>
                </div>
                <div v-else class="text-gray-500 text-center py-4">
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

// Tab切换状态
const activeTab = ref<'company' | 'keywords'>('keywords') // 'company' 或 'keywords'

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