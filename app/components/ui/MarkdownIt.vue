<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { watchThrottled } from '@vueuse/core';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const props = defineProps<{
  markdown: string;
}>();

const renderedHtml = ref('');
const md = new MarkdownIt({
  html: true,
  linkify: false,
  typographer: true,
});

const renderMarkdown = () => {
  const html = md.render(props.markdown);
  renderedHtml.value = DOMPurify.sanitize(html);
};

watchThrottled(
  () => props.markdown,
  () => renderMarkdown(),
  {
    throttle: 300,
    trailing: true,
    leading: true
  }
);

onMounted(() => {
  renderMarkdown();
});
</script>

<template>
  <div v-html="renderedHtml"></div>
</template>

<style scoped>
@reference "@/assets/global/css/design-tokens.css";

:deep(*) {
  @apply text-text;
}

:deep(a) {
  @apply text-primary hover:underline;
}

:deep(code) {
  @apply bg-bg-surface px-1 py-0.5 rounded text-sm;
}

:deep(pre) {
  @apply bg-bg-surface p-4 rounded-md overflow-x-auto;
}

:deep(pre code) {
  @apply bg-transparent p-0;
}

:deep(blockquote) {
  @apply border-l-4 border-border pl-4 italic;
}

:deep(h1),
:deep(h2),
:deep(h3),
:deep(h4),
:deep(h5),
:deep(h6) {
  @apply font-bold mt-6 mb-3;
}

:deep(h1) {
  @apply text-2xl;
}

:deep(h2) {
  @apply text-xl;
}

:deep(h3) {
  @apply text-lg;
}

:deep(p) {
  @apply my-4;
}

:deep(ul),
:deep(ol) {
  @apply my-4 pl-6;
}

:deep(ul) {
  @apply list-disc;
}

:deep(ol) {
  @apply list-decimal;
}

:deep(img) {
  @apply max-w-full rounded;
}
</style>