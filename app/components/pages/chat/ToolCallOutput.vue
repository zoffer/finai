<script lang="ts" setup>
import ExpandableObject from "./ExpandableObject.vue";
import type { ToolResultPart } from "@/composables/ai/agent/finai";

const props = defineProps<{
    output: ToolResultPart["output"];
}>();
</script>

<template>
    <template v-if="output.type === 'content'" v-for="(item, index) in output.value" :key="index">
        <template v-if="typeof item === 'object' && item.type === 'text'">
            <div class="whitespace-pre-wrap">
                {{ item.text }}
            </div>
        </template>
        <template v-else>
            <ExpandableObject :value="item" />
        </template>
    </template>
    <template v-else-if="output.type === 'text'">
        <div class="whitespace-pre-wrap">
            {{ output.value }}
        </div>
    </template>
    <template v-else>
        <ExpandableObject :value="output" />
    </template>
</template>