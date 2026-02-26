<template>
    <textarea ref="textareaRef" v-model="model" :placeholder="placeholder" :disabled="disabled"
        class="resize-none overflow-y-auto" @keydown.enter.exact.prevent @keyup.enter.exact="submit"></textarea>
</template>

<script lang="ts" setup>
import { useTemplateRef, watch, nextTick, onMounted } from 'vue'

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{
    (e: 'submit', value: string): void
}>()

const props = withDefaults(defineProps<{
    placeholder?: string
    disabled?: boolean
}>(), {
    placeholder: '输入消息...',
    disabled: false
})

const submit = () => {
    emit('submit', model.value)
}

const textareaRef = useTemplateRef('textareaRef')

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

onMounted(() => {
    watch(model, () => {
        nextTick(autoResize)
    }, { immediate: true })
})
</script>
