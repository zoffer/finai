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
                    <!-- 用户消息 -->
                    <div v-if="message.role === 'user'" :class="[
                        'max-w-[85%] sm:max-w-[75%] px-4 py-2.5',
                        'bg-primary text-white rounded-2xl rounded-br-sm'
                    ]">
                        <div class="whitespace-pre-wrap wrap-break-words text-sm sm:text-base leading-relaxed">
                            {{ message.content }}
                        </div>
                    </div>

                    <!-- 助手消息 -->
                    <div v-else-if="message.role === 'assistant'" :class="[
                        'max-w-[85%] sm:max-w-[75%] px-4 py-2.5',
                        'text-text'
                    ]">
                        <div v-if="message.reasoning" class="mb-3">
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

                        <!-- 工具调用展示 -->
                        <div v-if="message.toolCall" class="mb-3">
                            <button @click="message.showToolCall = !message.showToolCall"
                                class="flex items-center gap-2 text-xs text-text-muted hover:text-text transition-colors mb-2">
                                <svg :class="['w-3 h-3 transition-transform', message.showToolCall ? 'rotate-90' : '']"
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 5l7 7-7 7" />
                                </svg>
                                <span>工具调用: {{ message.toolCall.toolName }}</span>
                            </button>
                            <div v-show="message.showToolCall"
                                class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <div class="text-xs text-text-muted">
                                    <pre
                                        class="whitespace-pre-wrap">{{ JSON.stringify(message.toolCall.input, null, 2) }}</pre>
                                </div>
                            </div>
                        </div>

                        <div class="whitespace-pre-wrap wrap-break-words text-sm sm:text-base leading-relaxed">
                            {{ message.content }}
                        </div>
                    </div>

                    <!-- 工具结果消息 -->
                    <div v-else-if="message.role === 'tool'" class="max-w-[85%] sm:max-w-[75%] px-4 py-2.5 text-text">
                        <button @click="message.showToolResult = !message.showToolResult"
                            class="flex items-center gap-2 text-xs text-text-muted hover:text-text transition-colors mb-2">
                            <svg :class="['w-3 h-3 transition-transform', message.showToolResult ? 'rotate-90' : '']"
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5l7 7-7 7" />
                            </svg>
                            <span class="text-xs font-medium">
                                {{ message.toolResult?.isError ? '工具错误' : '工具结果' }}: {{ message.toolResult?.toolName }}
                            </span>
                        </button>
                        <div v-show="message.showToolResult" :class="[
                            'rounded-lg p-3',
                            message.toolResult?.isError
                                ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                                : 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                        ]">
                            <div class="text-xs text-text-muted">
                                <pre class="whitespace-pre-wrap">{{ message.content }}</pre>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="isLoading" class="flex justify-start">
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

                <div v-if="errorMessage" class="flex justify-start">
                    <div
                        class="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-2xl px-4 py-3 max-w-[85%] sm:max-w-[75%]">
                        <div class="flex items-start gap-2">
                            <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div class="flex-1">
                                <p class="text-sm">{{ errorMessage }}</p>
                                <button @click="errorMessage = ''"
                                    class="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors">
                                    关闭
                                </button>
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
                        <button :type="isLoading ? 'button' : 'submit'"
                            @click="isLoading ? cancelGeneration() : undefined" :disabled="!isLoading && !input.trim()"
                            :class="[
                                'p-2 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
                                'bg-primary hover:bg-primary/90 text-white'
                            ]">
                            <svg v-if="!isLoading" class="w-4 h-4" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            <div v-else class="w-4 h-4 flex items-center justify-center">
                                <svg class="w-3 h-3" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                                    <rect width="16" height="16" x="4" y="4" />
                                </svg>
                            </div>
                        </button>
                    </div>
                </form>
            </footer>
        </main>
    </div>
</template>

<script lang="ts" setup>
import { ref, shallowRef, watch, nextTick, onUnmounted, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { streamText, RetryError, APICallError, ToolLoopAgent } from 'ai'
import { createMCPClient, type MCPClient } from '@ai-sdk/mcp'
import { useAIProvider } from '@/composables/ai/provider'
import AutoResizeTextarea from '@/components/ui/AutoResizeTextarea.vue'

interface ToolCall {
    toolCallId: string
    toolName: string
    input: any
}

interface ToolResult {
    toolCallId: string
    toolName: string
    result: any
    isError?: boolean
}

interface Message {
    id: string
    role: 'user' | 'assistant' | 'tool'
    content: string
    reasoning?: string
    showReasoning?: boolean
    toolCall?: ToolCall
    showToolCall?: boolean
    toolResult?: ToolResult
    showToolResult?: boolean
}

const ABORT_REASON = "user-stop"
const provider = useAIProvider()

const messages = ref<Message[]>([])
const input = ref('')
const isLoading = ref(false)
const errorMessage = ref<string>('')
const messagesContainer = ref<HTMLElement | null>(null)
const showModelMenu = ref(false)
const abortController = shallowRef<AbortController | null>(null)
const mcpClient = shallowRef<MCPClient | undefined>()

const availableModels = ['GLM-4.5-Flash', 'GLM-4.7-Flash'] as const
const selectedModel = ref<(typeof availableModels)[number]>('GLM-4.7-Flash')

const selectModel = (model: (typeof availableModels)[number]) => {
    selectedModel.value = model
    showModelMenu.value = false
}

// 初始化MCP客户端
const initMCPClient = async () => {
    try {
        // 动态拼接URL，适应不同环境
        const baseUrl = window.location.origin
        mcpClient.value = await createMCPClient({
            transport: {
                type: 'http',
                url: `${baseUrl}/mcp`
            }
        })
    } catch (error) {
        console.error('Failed to initialize MCP client:', error)
    }
}

// 关闭MCP客户端
const closeMCPClient = async () => {
    if (mcpClient.value) {
        try {
            await mcpClient.value.close()
        } catch (error) {
            console.error('Failed to close MCP client:', error)
        } finally {
            mcpClient.value = undefined
        }
    }
}

// 组件挂载时初始化MCP客户端
onMounted(async () => {
    await initMCPClient()
})

// 组件卸载时关闭MCP客户端
onUnmounted(() => {
    closeMCPClient()
})

watch(input, () => {
    if (input.value.trim()) {
        clearError()
    }
})

const cancelGeneration = () => {
    if (abortController.value) {
        abortController.value.abort(ABORT_REASON)
        abortController.value = null
    }
}

const scrollToBottom = async () => {
    await nextTick()
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
}

const generateId = () => `${Date.now()}-${Math.random().toString(36)}`

const clearError = () => {
    errorMessage.value = ''
}

const sendMessage = async () => {
    clearError()
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
        // 获取MCP工具
        let tools = undefined
        if (mcpClient.value) {
            try {
                tools = await mcpClient.value.tools()
            } catch (error) {
                console.error('Failed to get MCP tools:', error)
            }
        }

        abortController.value = new AbortController()

        // 准备消息历史，确保包含工具调用和结果
        const prepareMessages = messages.value
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            }))

        // 创建ToolLoopAgent实例
        const agent = new ToolLoopAgent({
            model: provider.chatModel(selectedModel.value),
            tools: tools || {},
            stopWhen: ({ steps }) => steps.length > 20, // 最多20步
        })

        let hasError = false
        let currentAssistantMessage: Message | null = null
        let currentToolCallId: string | null = null

        // 使用agent.stream()来获取流式响应
        const result = await agent.stream({
            messages: prepareMessages,
            abortSignal: abortController.value.signal
        })

        for await (const delta of result.fullStream) {
            if (delta.type === 'reasoning-delta') {
                if (!currentAssistantMessage) {
                    // 先创建基本对象并push到数组中，确保响应式
                    messages.value.push({
                        id: generateId(),
                        role: 'assistant',
                        content: '',
                        reasoning: delta.text,
                        showReasoning: true
                    })
                    // 从数组中取出，确保操作的是响应式对象
                    currentAssistantMessage = messages.value[messages.value.length - 1]!
                } else {
                    currentAssistantMessage.reasoning += delta.text
                }
            } else if (delta.type === 'text-delta') {
                if (!currentAssistantMessage) {
                    // 先创建基本对象并push到数组中，确保响应式
                    messages.value.push({
                        id: generateId(),
                        role: 'assistant',
                        content: delta.text,
                        reasoning: '',
                        showReasoning: false
                    })
                    // 从数组中取出，确保操作的是响应式对象
                    currentAssistantMessage = messages.value[messages.value.length - 1]!
                } else {
                    currentAssistantMessage.showReasoning = false
                    currentAssistantMessage.content += delta.text
                }
            } else if (delta.type === 'tool-call') {
                // 工具调用开始
                if (!currentAssistantMessage) {
                    // 先创建基本对象并push到数组中，确保响应式
                    messages.value.push({
                        id: generateId(),
                        role: 'assistant',
                        content: '',
                        reasoning: '',
                        showReasoning: true,
                        showToolCall: false,
                        toolCall: {
                            toolCallId: delta.toolCallId,
                            toolName: delta.toolName,
                            input: delta.input
                        }
                    })
                    // 从数组中取出，确保操作的是响应式对象
                    currentAssistantMessage = messages.value[messages.value.length - 1]!
                } else {
                    currentAssistantMessage.toolCall = {
                        toolCallId: delta.toolCallId,
                        toolName: delta.toolName,
                        input: delta.input
                    }
                    currentAssistantMessage.showToolCall = false
                }
                currentToolCallId = delta.toolCallId
            } else if (delta.type === 'tool-result') {
                // 工具调用结果
                if (currentToolCallId) {
                    const toolResultMessage: Message = {
                        id: generateId(),
                        role: 'tool',
                        content: JSON.stringify(delta.output, null, 2),
                        toolResult: {
                            toolCallId: currentToolCallId,
                            toolName: delta.toolName,
                            result: delta.output,
                            isError: 'isError' in delta ? Boolean(delta.isError) : false
                        },
                        showToolResult: false
                    }
                    messages.value.push(toolResultMessage)
                    currentToolCallId = null
                    // 工具执行完成后，重置currentAssistantMessage，开启新一轮回复
                    currentAssistantMessage = null
                }
            } else if (delta.type === "error") {
                hasError = true
                let error = delta.error
                console.error('stream error:', error)
                if (RetryError.isInstance(error)) {
                    error = error.lastError
                }
                if (APICallError.isInstance(error)) {
                    errorMessage.value = error.message || '抱歉，发生了错误，请稍后重试。'
                } else {
                    errorMessage.value = '抱歉，发生了错误，请稍后重试。'
                }
            }
            await scrollToBottom()
        }

        if (hasError && currentAssistantMessage) {
            messages.value.pop()
        }

    } catch (error) {
        console.error('Chat error:', error, typeof error)
        if (abortController.value && !abortController.value.signal.aborted) {
            messages.value.pop()
            errorMessage.value = '抱歉，发生了错误，请稍后重试。'
        } else if (messages.value[messages.value.length - 1]?.content === '' && messages.value[messages.value.length - 1]?.reasoning === '') {
            messages.value.pop()
        }
    } finally {
        isLoading.value = false
        abortController.value = null
        await scrollToBottom()
    }
}
</script>
