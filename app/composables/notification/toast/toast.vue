<script setup lang="ts">
import { ref } from 'vue'

export interface ToastItem {
    id: string
    message: string
    type: 'success' | 'error' | 'warning'
}

const toasts = ref<ToastItem[]>([])

const add = (item: ToastItem, duration: number) => {
    toasts.value.push(item)
    setTimeout(() => {
        remove(item.id)
    }, duration)
}

const remove = (id: string) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
}

defineExpose({ add, remove })
</script>

<template>
    <ClientOnly>
        <Teleport to="body">
            <div class="fixed top-5 right-5 z-999 flex flex-col gap-2 pointer-events-none">
                <TransitionGroup name="toast">
                    <div v-for="item in toasts" :key="item.id"
                        class="pointer-events-auto px-4 py-2 rounded shadow-lg text-white text-sm transition-all"
                        :class="{
                            'bg-success': item.type === 'success',
                            'bg-error': item.type === 'error',
                            'bg-warning': item.type === 'warning'
                        }">
                        {{ item.message }}
                    </div>
                </TransitionGroup>
            </div>
        </Teleport>
    </ClientOnly>
</template>

<style scoped>
/* 动画逻辑保持不变 */
.toast-enter-active,
.toast-leave-active {
    transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateX(30px);
}
</style>