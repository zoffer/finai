<template>
    <div class="min-h-screen bg-linear-to-br from-bg-surface to-bg flex flex-col">
        <main class="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
            <!-- Header -->
            <div class="bg-bg rounded-2xl shadow-md shadow-shadow p-4 sm:p-6 mb-6 sm:mb-8 transition-all duration-300">
                <h1 class="text-xl sm:text-2xl font-bold text-text">{{ decodeURIComponent(keyword) }}</h1>
                <p class="text-text-muted mt-1 text-sm">相关新闻</p>
            </div>

            <!-- News List -->
            <div class="bg-bg rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
                <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 px-6">
                    <div class="w-16 h-16 border-4 border-secondary border-t-primary rounded-full animate-spin mb-4"></div>
                    <p class="text-text font-medium">加载中，请稍候...</p>
                </div>

                <div v-else-if="error" class="flex flex-col items-center justify-center py-20 px-6 text-center">
                    <svg
                        class="w-16 h-16 text-error mb-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12" y2="16"></line>
                    </svg>
                    <p class="text-text font-medium text-lg mb-6">{{ error }}</p>
                    <button
                        @click="refresh()"
                        class="px-6 py-3 bg-linear-to-r from-primary to-secondary text-text font-medium rounded-xl hover:from-primary hover:to-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform hover:scale-105 active:scale-95"
                    >
                        重试
                    </button>
                </div>

                <div
                    v-else-if="!newsList || newsList.length === 0"
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
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </div>
                    <p class="text-text font-medium text-base sm:text-lg">暂无相关新闻</p>
                </div>

                <div v-else class="p-4 sm:p-6 space-y-4">
                    <div
                        v-for="(news, index) in newsList"
                        :key="news.id"
                        class="bg-bg-surface rounded-xl p-4 sm:p-5 transition-all duration-200 hover:shadow-md"
                    >
                        <h3 class="text-lg font-semibold text-text mb-2 line-clamp-2">
                            {{ news.title }}
                        </h3>
                        <p class="text-text-muted text-sm mb-4">
                            {{ news.content }}
                        </p>
                        <div class="flex items-center gap-4 text-xs text-text-muted/70">
                            <span>{{ formatDate(news.date) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script lang="ts" setup>
type News = {
    id: string;
    title: string;
    content: string;
    date: string;
};

const route = useRoute();
const keyword = computed(() => route.params.keyword as string);

const {
    data: newsList,
    pending: isLoading,
    error,
    refresh,
} = useAsyncData(
    `keyword-news-${keyword.value}`,
    async ({ $api }, { signal }) => {
        const res = await $api("/api/news/keyword/list/news", {
            signal,
            query: { keyword: decodeURIComponent(keyword.value) },
        });
        return res.data as News[];
    },
    {
        watch: [keyword],
    },
);

const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};
</script>
