<template>
    <div
        class="min-h-screen bg-linear-to-br from-bg via-bg-surface to-bg flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div class="w-full max-w-md">
            <div class="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-border/20">
                <div class="text-center mb-8">
                    <div
                        class="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-primary to-secondary rounded-2xl mb-4 shadow-lg shadow-primary/20">
                        <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                            <path d="M2 17l10 5 10-5"></path>
                            <path d="M2 12l10 5 10-5"></path>
                        </svg>
                    </div>
                    <h1 class="text-2xl sm:text-3xl font-bold text-text mb-2">登录/注册</h1>
                </div>

                <form @submit.prevent="handleSubmit()" class="space-y-10">
                    <div class="relative">
                        <label for="email" class="block text-sm font-medium text-text-muted mb-2">邮箱地址</label>
                        <div class="relative">
                            <input id="email" v-model="formData.email" type="email" placeholder="请输入邮箱"
                                :disabled="isSending || isSubmitting" autocomplete="off" @blur="showError()"
                                class="w-full px-4 py-3 sm:py-3.5 bg-bg-surface border border-border rounded-xl text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" />
                            <svg class="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted"
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z">
                                </path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                        </div>
                        <p v-show="errorMessage.email" class="absolute -bottom-6 left-0 text-sm text-error">
                            {{ errorMessage.email }}
                        </p>
                    </div>

                    <div class="relative">
                        <label for="code" class="block text-sm font-medium text-text-muted mb-2">验证码</label>
                        <div class="relative">
                            <input id="code" v-model="formData.code" type="text" inputmode="numeric" maxlength="6"
                                placeholder="请输入6位验证码" :disabled="isSending || isSubmitting" autocomplete="off"
                                @blur="showError()"
                                class="w-full pr-28 px-4 py-3 sm:py-3.5 bg-bg-surface border border-border rounded-xl text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" />
                            <button type="button" @click="sendVerificationCode()"
                                :disabled="!canSendCode || isSending || isSubmitting"
                                class="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                :class="canSendCode ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30' : 'bg-border text-text-muted'">
                                {{ countdown > 0 ? `${countdown}秒` : '发送验证码' }}
                            </button>
                        </div>
                        <p v-show="errorMessage.code" class="absolute -bottom-6 left-0 text-sm text-error">
                            {{ errorMessage.code }}
                        </p>
                    </div>

                    <button type="submit" :disabled="isSubmitting || zodError != null"
                        class="w-full py-3.5 sm:py-4 bg-linear-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98]">
                        <span v-if="isSubmitting" class="flex items-center justify-center">
                            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                    stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                </path>
                            </svg>
                            登录中...
                        </span>
                        <span v-else>登录/注册</span>
                    </button>
                </form>

            </div>

        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { navigateTo } from 'nuxt/app'
import { z } from 'zod'
import { useCountdown } from '@vueuse/core'
import { useToast } from '@/composables/notification/toast'

const schema = z.object({
    email: z.email('请输入有效的邮箱地址').trim(),
    code: z.string().regex(/^\d{6}$/, '验证码必须是6位数字')
})

type FormData = z.infer<typeof schema>

const formData = ref<FormData>({
    email: '',
    code: ''
})

const errorMessage = ref<{ [key in keyof FormData]?: string | null }>({})
const zodError = computed(() => {
    const data = formData.value
    const result = schema.safeParse(data)
    if (result.success) {
        return null
    }
    const e = z.flattenError(result.error).fieldErrors
    return {
        email: e.email != null ? e.email[0] : null,
        code: e.code != null ? e.code[0] : null,
    }
})
watch(zodError, (val) => {
    if (val == null) {
        errorMessage.value = {};
        return
    }
    if (!val.email || !formData.value.email) {
        errorMessage.value.email = null
    }
    if (!val.code || !formData.value.code) {
        errorMessage.value.code = null
    }
})
const showError = () => {
    const e = zodError.value
    if (e == null) return
    if (formData.value.email) {
        errorMessage.value.email = e.email
    }
    if (formData.value.code) {
        errorMessage.value.code = e.code
    }
}


const toast = useToast()
const { remaining: countdown, start: startCountdown } = useCountdown(0)

const canSendCode = computed(() => {
    return countdown.value <= 0 && zodError.value?.email == null
})

const { execute: sendVerificationCode, pending: isSending } = useAsyncData(async ({ $api }, { signal }) => {
    if (!canSendCode.value) return

    try {
        const res = await $api('/api/auth/email/code', {
            signal,
            method: 'POST',
            body: {
                email: formData.value.email
            }
        })

        toast.success(res.message || '验证码已发送，请查收邮箱')
        startCountdown(60)
    } catch (error: any) {
        toast.error(error?.data?.message || '发送验证码失败，请稍后重试')
        console.error('发送验证码失败:', error)
    }
}, {
    immediate: false,
})

const { execute: handleSubmit, pending: isSubmitting } = useAsyncData(async ({ $api }, { signal }) => {

    if (zodError.value != null) {
        return
    }

    try {
        const response = await $api('/api/auth/email/login', {
            signal,
            method: 'POST',
            body: {
                email: formData.value.email,
                code: formData.value.code
            }
        })

        toast.success(response.message || '登录成功，正在跳转...')
        await navigateTo('/')
    } catch (error: any) {
        toast.error(error?.data?.message || '登录失败，请检查验证码是否正确')
        console.error('登录失败:', error)
    }
}, {
    immediate: false,
})

</script>