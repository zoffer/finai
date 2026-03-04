<template>
    <div class="bg-bg">
        <main class="flex-1 w-full h-screen max-h-screen flex flex-col" style="height: 100dvh;">
            <div ref="messagesContainer" class="flex-1 overflow-y-auto px-6 sm:px-8 lg:px-10 py-6">
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

                <div v-for="(message, index) in messages" :key="index" class="flex flex-col"
                    :class="[message.role === 'user' ? 'items-end' : 'items-start']">
                    <template v-if="message.role === 'user'">
                        <!-- 用户消息 -->
                        <div
                            class="max-w-[85%] sm:max-w-[75%] px-4 py-2.5 mb-3 bg-primary text-white rounded-2xl rounded-br-sm relative group">
                            <div class="whitespace-pre-wrap wrap-break-words text-sm sm:text-base leading-relaxed">
                                {{message.content.map((part) => part.text).join('')}}
                            </div>
                            <div v-if="status !== 'pending'"
                                class="md:opacity-0 group-hover:opacity-100 transition-opacity absolute right-full top-0 bottom-0 flex items-center justify-center">
                                <!-- 重发按钮 -->
                                <button @click="resendMessage(index)"
                                    class="flex items-center justify-center gap-1 p-3 text-xs rounded-full hover:bg-primary/30 text-primary transition-colors"
                                    title="重发消息">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </template>

                    <!-- 助手消息 -->
                    <div v-else-if="message.role === 'assistant'" class="px-4 text-text max-w-full">
                        <!-- 消息内容 -->
                        <template v-for="(part, partIndex) in message.content" :key="partIndex">
                            <!-- 思考过程 -->
                            <div v-if="part.type === 'reasoning'" class="group" :data-unfold="unfold.has(part)">
                                <button @click="toggleUnfold(part)"
                                    class="flex items-center gap-2 text-xs text-text-muted hover:text-text transition-colors mb-2">
                                    <svg class="w-3 h-3 transition-transform group-data-[unfold=true]:rotate-90"
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 5l7 7-7 7" />
                                    </svg>
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span>思考过程</span>
                                </button>
                                <div
                                    class="hidden group-data-[unfold=true]:block bg-bg-surface/50 rounded-lg p-3 text-xs text-text-muted whitespace-pre-wrap wrap-break-word leading-relaxed mb-2">
                                    {{ part.text }}
                                </div>
                                <!-- 流式传输时的部分展示 -->
                                <div v-if="streamingPart === part && !unfold.has(part)"
                                    class="opacity-60 flex flex-col-reverse max-h-18 overflow-hidden bg-bg-surface/50 rounded-lg p-3 text-xs text-text-muted whitespace-pre-wrap wrap-break-word leading-relaxed mb-2">
                                    {{ part.text }}
                                </div>
                            </div>


                            <!-- 工具调用展示 -->
                            <div v-else-if="part.type === 'tool-call'" class="group" :data-unfold="unfold.has(part)">
                                <button @click="toggleUnfold(part)"
                                    class="flex items-center gap-2 text-xs text-text-muted hover:text-text transition-colors mb-2">
                                    <svg class="w-3 h-3 transition-transform group-data-[unfold=true]:rotate-90"
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 5l7 7-7 7" />
                                    </svg>
                                    <svg v-if="toolCallResult[part.toolCallId] == null" class="w-3 h-3" fill="none"
                                        stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>工具调用: {{ part.toolName }}</span>
                                </button>
                                <div class="hidden group-data-[unfold=true]:block bg-bg-surface rounded-lg p-3 mb-2">
                                    <div class="text-xs text-text-muted">
                                        <div class="font-medium mb-1">输入参数</div>
                                        <div class="p-2 bg-bg rounded overflow-auto max-h-40">
                                            <ExpandableObject :value="part.input" />
                                        </div>

                                        <div v-if="toolCallResult[part.toolCallId] != null" class="mt-3">
                                            <div class="border-t border-border pt-3">
                                                <div class="font-medium mb-1">输出结果
                                                </div>
                                                <div class="p-2 bg-bg rounded overflow-auto max-h-40">
                                                    <ToolCallOutput :output="toolCallResult[part.toolCallId]!.output" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 文本内容 -->
                            <div v-else-if="part.type === 'text'" class="my-2">
                                <MarkdownIt :markdown="part.text" class="text-sm sm:text-base leading-relaxed" />
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

            <footer class="flex-initial px-6 sm:px-8 lg:px-10 pb-6">
                <form
                    class="bg-bg-surface rounded-2xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
                    <AutoResizeTextarea ref="messageInput" name="message" v-model="input"
                        :disabled="status === 'pending'" @submit="sendMessage"
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
import { ref, nextTick, useTemplateRef, computed } from 'vue'
import { watchThrottled } from "@vueuse/core"
import { useFinaiAgent, type ToolModelMessage } from '@/composables/ai/agent/finai'
import AutoResizeTextarea from '@/components/ui/AutoResizeTextarea.vue'
import MarkdownIt from '@/components/ui/MarkdownIt.vue'
import ExpandableObject from '~/components/pages/chat/ExpandableObject.vue'
import ToolCallOutput from '~/components/pages/chat/ToolCallOutput.vue'

const input = ref('')

const unfold = ref(new WeakSet())
const toggleUnfold = (part: WeakKey) => {
    if (unfold.value.has(part)) {
        unfold.value.delete(part)
    } else {
        unfold.value.add(part)
    }
}

const availableModels = ['GLM-4.5-Flash', 'GLM-4.7-Flash'] as const
const showModelMenu = ref(false)
const selectedModel = ref<(typeof availableModels)[number]>('GLM-4.7-Flash')
const selectModel = (model: (typeof availableModels)[number]) => {
    selectedModel.value = model
    showModelMenu.value = false
}

const messagesContainer = useTemplateRef('messagesContainer')
const messageInput = useTemplateRef('messageInput')
const scrollToBottom = async () => {
    await nextTick()
    if (messagesContainer.value) {
        const element = messagesContainer.value
        element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth'
        });
    }
}

// 使用 useFinaiAgent
const { send, cancel, messages, status, error, streamingPart } = useFinaiAgent()
const sendMessage = async () => {
    const userMessage = input.value.trim()
    if (!userMessage || status.value === 'pending') return
    input.value = ''
    // 调用 useFinaiAgent 的 send 方法
    await send(
        { model: selectedModel.value },
        { type: 'text', text: userMessage }
    )
}
const resendMessage = (index: number) => {
    const msg = messages.value[index]
    if (!msg || msg.role !== 'user') { return }
    for (const part of msg.content) {
        error.value = null
        input.value = part.text
        messages.value = messages.value.slice(0, index)
        nextTick(() => {
            scrollToBottom()
            messageInput.value?.$el.focus()
        })
        return
    }
}

const toolCallResult = computed(() => {
    const kv: Record<string, ToolModelMessage["content"][number]> = {}
    for (const msg of messages.value) {
        if (msg.role === 'tool') {
            for (const part of msg.content) {
                if (part.type === 'tool-result') {
                    kv[part.toolCallId] = part
                }
            }
        }
    }
    return kv
})

watchThrottled(messages, () => {
    scrollToBottom()
}, {
    throttle: 300,
    trailing: true,
    deep: true
})
</script>
