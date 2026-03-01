<template>
    <div class="text-xs">
        <div v-if="value == null" class="text-text-muted">
            {{ value === null ? 'null' : 'undefined' }}
        </div>
        <div v-else-if="typeof value === 'object'">
            <div v-if="depth > 0" class="space-y-1">
                <div v-for="(val, key) in value" :key="key" class="flex items-start">
                    <div class="font-medium text-text mr-2">{{ key }}:</div>
                    <div class="flex-1">
                        <ExpandableObject :value="val" :depth="depth - 1" />
                    </div>
                </div>
            </div>
            <div v-else class="text-text-muted">
                {{ Array.isArray(value) ? '[...]' : '{...}' }}
            </div>
        </div>
        <div v-else-if="typeof value === 'string'">"{{ value }}"</div>
        <div v-else>{{ value }}</div>
    </div>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
    value: unknown
    depth?: number
}>(), {
    depth: 5
})
</script>
