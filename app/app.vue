<template>
    <NuxtLayout>
        <NuxtPage />
    </NuxtLayout>
</template>

<script lang="ts" setup>
// 默认页面信息
useSeoMeta({
    title: "finai",
    description: "finance ai",
});
</script>

<style lang="scss">
ul {
    list-style: disc;
}

body {
    margin: 0;
    padding: 0;
}
</style>
