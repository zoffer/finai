<template>
    <div class="min-h-screen bg-bg flex flex-col">
        <main class="flex-1 w-full h-screen max-h-screen max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
            <div ref="messagesContainer" class="flex-1 overflow-y-auto space-y-4">
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

                <div v-for="message in messages" :key="message.id" :class="[
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                ]">
                    <div :class="[
                        'max-w-[85%] sm:max-w-[75%] px-4 py-2.5',
                        message.role === 'user'
                            ? 'bg-primary text-white rounded-2xl rounded-br-sm'
                            : 'text-text'
                    ]">
                        <div v-if="message.role === 'assistant' && message.reasoning" class="mb-3">
                            <button @click="message.showReasoning = !message.showReasoning"
                                class="flex items-center gap-2 text-xs text-text-muted hover:text-text transition-colors mb-2">
                                <svg :class="['w-3 h-3 transition-transform', message.showReasoning ? 'rotate-90' : '']"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 5l7 7-7 7" />
                                </svg>
                                <span>思考过程</span>
                            </button>
                            <div v-show="message.showReasoning"
                                class="bg-bg-surface/50 rounded-lg p-3 text-xs text-text-muted whitespace-pre-wrap wrap-break-words leading-relaxed">
                                {{ message.reasoning }}
                            </div>
                        </div>
                        <div class="whitespace-pre-wrap wrap-break-words text-sm sm:text-base leading-relaxed">
                            {{ message.content }}
                        </div>
                    </div>
                </div>

                <div v-if="isLoading" class="flex justify-start">
                    <div class="text-text px-4 py-2.5">
                        <div class="flex items-center space-x-2">
                            <div class="flex space-x-1">
                                <div class="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                                    style="animation-delay: 0ms"></div>
                                <div class="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                                    style="animation-delay: 150ms"></div>
                                <div class="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                                    style="animation-delay: 300ms"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer class="flex-initial py-4">
                <form @submit.prevent="sendMessage"
                    class="bg-bg-surface rounded-2xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
                    <AutoResizeTextarea v-model="input" :disabled="isLoading"
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
                        <button type="submit" :disabled="isLoading || !input.trim()"
                            class="p-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </form>
            </footer>
        </main>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { streamText } from 'ai'
import { useAIProvider } from '@/composables/ai/provider'
import AutoResizeTextarea from '@/components/ui/AutoResizeTextarea.vue'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    reasoning?: string
    showReasoning?: boolean
}

const provider = useAIProvider()

const messages = ref<Message[]>([])
const input = ref('')
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const showModelMenu = ref(false)

const availableModels = ['GLM-4.5-Flash', 'GLM-4.7-Flash'] as const
const selectedModel = ref<(typeof availableModels)[number]>('GLM-4.7-Flash')

const selectModel = (model: (typeof availableModels)[number]) => {
    selectedModel.value = model
    showModelMenu.value = false
}

const scrollToBottom = async () => {
    await nextTick()
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const sendMessage = async () => {
    const userMessage = input.value.trim()
    if (!userMessage || isLoading.value) return

    input.value = ''

    messages.value.push({
        id: generateId(),
        role: 'user',
        content: userMessage
    })

    await scrollToBottom()

    isLoading.value = true

    try {
        const result = streamText({
            model: provider.chatModel(selectedModel.value),
            messages: messages.value.map(m => ({
                role: m.role,
                content: m.content
            })),
        })

        const assistantMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: '',
            reasoning: '',
            showReasoning: true
        }
        messages.value.push(assistantMessage)
        const msg = messages.value[messages.value.length - 1]!

        for await (const delta of result.fullStream) {
            if (delta.type === 'reasoning-delta') {
                msg.reasoning += delta.text
            } else if (delta.type === 'text-delta') {
                msg.showReasoning = false
                msg.content += delta.text
            }
            await scrollToBottom()
        }

    } catch (error) {
        console.error('Chat error:', error)
        messages.value.push({
            id: generateId(),
            role: 'assistant',
            content: '抱歉，发生了错误，请稍后重试。'
        })
    } finally {
        isLoading.value = false
        await scrollToBottom()
    }
}
</script>
