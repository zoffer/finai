<template>
    <div class="min-h-screen bg-linear-to-br from-bg-surface to-bg flex flex-col items-center">
        <main class="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
            <div class="bg-bg rounded-2xl shadow-md shadow-shadow p-4 sm:p-6 mb-6 sm:mb-8 transition-all duration-300">
                <h1 class="text-xl sm:text-2xl font-bold text-text">热门关键词</h1>
                <p class="text-text-muted mt-1 text-sm">基于新闻影响分析的热门关键词</p>
            </div>

            <div class="bg-bg rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl min-h-[300px]">
                <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 px-6">
                    <div class="w-16 h-16 border-4 border-secondary border-t-primary rounded-full animate-spin mb-4"></div>
                    <p class="text-text font-medium">加载中，请稍候...</p>
                </div>

                <div
                    v-else-if="!keywords || keywords.length === 0"
                    class="flex flex-col items-center justify-center py-16 px-4 text-center"
                >
                    <div class="w-auto text-text-muted mb-4">
                        <svg
                            viewBox="0 0 24 24"
                            width="60"
                            height="60"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M10 13a5 5 0 0 0 7.54-.54A4 4 0 1 1 14 16h-4v-4z"></path>
                            <path
                                d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                    </div>
                    <p class="text-text font-medium text-base sm:text-lg">暂无关键词数据</p>
                </div>

                <div v-else class="p-4 sm:p-6">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <NuxtLink
                            v-for="(item, index) in keywords"
                            :key="item.keyword"
                            :to="`/keyword/detail/${encodeURIComponent(item.keyword)}`"
                            class="bg-bg-surface rounded-xl p-4 sm:p-5 transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer block"
                        >
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex items-center gap-2">
                                    <span
                                        class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm"
                                        >{{ index + 1 }}</span
                                    >
                                    <span class="font-bold text-text text-lg">{{ item.keyword }}</span>
                                </div>
                                <svg
                                    class="text-text-muted/50 w-5 h-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </div>
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <div class="flex items-center gap-2">
                                    <svg
                                        class="text-text-muted"
                                        viewBox="0 0 24 24"
                                        width="16"
                                        height="16"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                    <span class="font-medium text-text">{{ item.news_count }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <svg
                                        class="text-text-muted"
                                        viewBox="0 0 24 24"
                                        width="16"
                                        height="16"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <line x1="12" y1="20" x2="12" y2="10"></line>
                                        <line x1="18" y1="20" x2="18" y2="4"></line>
                                        <line x1="6" y1="20" x2="6" y2="16"></line>
                                    </svg>
                                    <span class="font-medium" :class="getEffectColor(item.avg_effect)">{{
                                        formatEffect(item.avg_effect)
                                    }}</span>
                                </div>
                            </div>
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script lang="ts" setup>
type HotKeyword = {
    keyword: string;
    news_count: number;
    avg_effect: number;
};

const { data: keywords, pending: isLoading } = useAsyncData(async ({ $api }, { signal }) => {
    const res = await $api("/api/news/keyword/hot", {
        signal,
        query: { size: 60 },
    });
    return res.data as HotKeyword[];
});

const formatEffect = (value: number) => {
    return value.toFixed(2);
};

const getEffectColor = (value: number) => {
    if (value > 0) return "text-up";
    if (value < 0) return "text-down";
    return "text-text";
};
</script>
