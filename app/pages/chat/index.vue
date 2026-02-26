<template>
    <div class="min-h-screen bg-bg flex flex-col">
        <main class="flex-1 w-full h-screen max-h-screen max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
            <div ref="messagesContainer" class="flex-1 overflow-y-auto">
                <div v-if="messages.length === 0"
                    class="flex flex-col items-center justify-center h-full text-center py-12">
                    <div class="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                    <p class="text-text font-medium mb-1">开始新对话</p>
                    <p class="text-text-muted text-sm">输入消息开始与 AI 助手交流</p>
                </div>

                <div v-for="(message, index) in messages" :key="index" :class="[
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                ]">
                    <!-- 用户消息 -->
                    <div v-if="message.role === 'user'" :class="[
                        'max-w-[85%] sm:max-w-[75%] px-4 py-2.5',
                        'bg-primary text-white rounded-2xl rounded-br-sm'
                    ]">
                        <div class="whitespace-pre-wrap wrap-break-words text-sm sm:text-base leading-relaxed">
                            {{message.content.map((part) => part.text).join('')}}
                        </div>
                    </div>

                    <!-- 助手消息 -->
                    <div v-else-if="message.role === 'assistant'" :class="[
                        'max-w-[85%] sm:max-w-[75%] px-4',
                        'text-text'
                    ]">
                        <!-- 消息内容 -->
                        <template v-for="(part, partIndex) in message.content" :key="partIndex">
                            <!-- 思考过程 -->
                            <div v-if="part.type === 'reasoning'">
                                <button @click="part.showReasoning = !part.showReasoning"
                                    class="flex items-center gap-2 text-xs text-text-muted hover:text-text transition-colors mb-2">
                                    <svg :class="['w-3 h-3 transition-transform', part.showReasoning ? 'rotate-90' : '']"
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span>思考过程</span>
                                </button>
                                <div v-show="part.showReasoning"
                                    class="bg-bg-surface/50 rounded-lg p-3 text-xs text-text-muted whitespace-pre-wrap wrap-break-words leading-relaxed mb-2">
                                    {{ part.text }}
                                </div>
                            </div>

                            <!-- 工具调用展示 -->
                            <div v-else-if="part.type === 'tool-call'">
                                <button @click="part.showToolCall = !part.showToolCall"
                                    class="flex items-center gap-2 text-xs text-text-muted hover:text-text transition-colors mb-2">
                                    <svg :class="['w-3 h-3 transition-transform', part.showToolCall ? 'rotate-90' : '']"
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span>工具调用: {{ part.toolName }}</span>
                                </button>
                                <div v-show="part.showToolCall"
                                    class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-2">
                                    <div class="text-xs text-text-muted">
                                        <pre class="whitespace-pre-wrap">{{ JSON.stringify(part.input, null, 2) }}</pre>
                                    </div>
                                </div>
                            </div>

                            <!-- 文本内容 -->
                            <div v-else-if="part.type === 'text'" class="my-2">
                                <MarkdownIt :markdown="part.text" class="text-sm sm:text-base leading-relaxed" />
                            </div>
                        </template>
                    </div>

                    <!-- 工具结果消息 -->
                    <div v-else-if="message.role === 'tool'" class="max-w-[85%] sm:max-w-[75%] px-4 text-text">
                        <template v-for="(part, partIndex) in message.content" :key="partIndex">
                            <div v-if="part.type === 'tool-result'">
                                <button @click="part.showToolResult = !part.showToolResult"
                                    class="flex items-center gap-2 text-xs text-text-muted hover:text-text transition-colors mb-2">
                                    <svg :class="['w-3 h-3 transition-transform', part.showToolResult ? 'rotate-90' : '']"
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span class="text-xs font-medium">
                                        工具结果: {{ part.toolName }}
                                    </span>
                                </button>
                                <div v-show="part.showToolResult"
                                    class="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-2">
                                    <div class="text-xs text-text-muted">
                                        <pre
                                            class="whitespace-pre-wrap">{{ typeof part.output === 'object' && part.output !== null ? JSON.stringify(part.output, null, 2) : String(part.output) }}</pre>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>

                <div v-if="status === 'pending'" class="flex justify-start">
                    <div class="text-text px-4 py-2.5 flex items-center space-x-2">
                        <div class="flex space-x-1">
                            <div class="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style="animation-delay: 0ms">
                            </div>
                            <div class="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                                style="animation-delay: 150ms"></div>
                            <div class="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                                style="animation-delay: 300ms"></div>
                        </div>
                    </div>
                </div>

                <div v-if="status === 'error'" class="flex justify-start">
                    <div
                        class="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-2xl px-4 py-3 max-w-[85%] sm:max-w-[75%]">
                        <div class="flex items-start gap-2">
                            <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div class="flex-1">
                                <p class="text-sm">{{ typeof error === 'object' && error !== null && 'message' in error
                                    ? error.message
                                    : '抱歉，发生了错误，请稍后重试。' }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer class="flex-initial py-4">
                <form
                    class="bg-bg-surface rounded-2xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
                    <AutoResizeTextarea name="message" v-model="input" :disabled="status === 'pending'"
                        @submit="sendMessage"
                        class="w-full px-4 pt-3 pb-2 rounded-t-2xl border-0 focus:outline-none text-sm font-medium bg-transparent text-text placeholder:text-text-muted disabled:opacity-50 disabled:cursor-not-allowed min-h-[4em] max-h-[16em] resize-none" />
                    <div class="flex items-center justify-between px-3 pb-3">
                        <div class="relative">
                            <button type="button" @click="showModelMenu = !showModelMenu"
                                class="flex items-center gap-1.5 px-2 py-1.5 text-xs text-text-muted hover:text-text hover:bg-bg rounded-md transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>{{ selectedModel }}</span>
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div v-if="showModelMenu"
                                class="absolute bottom-full left-0 mb-2 bg-bg rounded-lg border border-border shadow-lg overflow-hidden z-10 min-w-[160px]">
                                <button v-for="model in availableModels" :key="model" type="button"
                                    @click="selectModel(model)"
                                    :class="['w-full px-4 py-2.5 text-left text-sm hover:bg-bg-surface transition-colors', selectedModel === model ? 'text-primary font-medium' : 'text-text']">
                                    {{ model }}
                                </button>
                            </div>
                        </div>
                        <button v-if="status !== 'pending'" type="button" @click="sendMessage" :disabled="!input.trim()"
                            class="p-2 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-primary hover:bg-primary/90 text-white">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                        <button v-else type="button" @click="cancel()"
                            class="p-2 rounded-full transition-all duration-200 bg-primary hover:bg-primary/90 text-white">
                            <svg class="w-3 h-3" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                                <rect width="16" height="16" x="4" y="4" />
                            </svg>
                        </button>
                    </div>
                </form>
            </footer>
        </main>
    </div>
</template>

<script lang="ts" setup>
import { ref, nextTick } from 'vue'
import { watchThrottled } from "@vueuse/core"
import { useFinaiAgent } from '@/composables/ai/agent/finai'
import AutoResizeTextarea from '@/components/ui/AutoResizeTextarea.vue'
import MarkdownIt from '@/components/ui/MarkdownIt.vue'

const input = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const showModelMenu = ref(false)

// 使用 useFinaiAgent
const { send, cancel, messages, status, error } = useFinaiAgent()

const availableModels = ['GLM-4.5-Flash', 'GLM-4.7-Flash'] as const
const selectedModel = ref<(typeof availableModels)[number]>('GLM-4.7-Flash')

const selectModel = (model: (typeof availableModels)[number]) => {
    selectedModel.value = model
    showModelMenu.value = false
}

const sendMessage = async () => {
    const userMessage = input.value.trim()
    if (!userMessage || status.value === 'pending') return

    input.value = ''

    // 调用 useFinaiAgent 的 send 方法
    await send(
        {
            role: 'user',
            content: [{
                type: 'text',
                text: userMessage
            }]
        },
        { model: selectedModel.value }
    )

}

const scrollToBottom = async () => {
    await nextTick()
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
}

watchThrottled(messages, () => {
    if (status.value === 'pending') {
        scrollToBottom()
    }
}, {
    throttle: 300,
    deep: true
})
</script>
