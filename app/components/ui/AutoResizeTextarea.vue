<template>
    <textarea ref="textareaRef" v-model="model" :placeholder="placeholder" :disabled="disabled" rows="1"
        @input="autoResize" class="resize-none overflow-y-auto" :class="attrs.class"
        :style="attrs.style as StyleValue" />
</template>

<script lang="ts" setup>
import type { StyleValue } from 'vue'

const model = defineModel<string>({ default: '' })

const props = withDefaults(defineProps<{
    placeholder?: string
    disabled?: boolean
}>(), {
    placeholder: '输入消息...',
    disabled: false
})

const attrs = useAttrs()
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const autoResize = () => {
    const textarea = textareaRef.value
    if (!textarea) return
    const computed = window.getComputedStyle(textarea)
    const minHeight = parseFloat(computed.minHeight) || 0
    const maxHeight = parseFloat(computed.maxHeight) || Infinity
    textarea.style.height = 'auto'
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight)
    textarea.style.height = `${newHeight}px`
}

watch(model, () => {
    nextTick(autoResize)
})

onMounted(autoResize)
</script>
