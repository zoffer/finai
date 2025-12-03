<template>
    <NuxtLayout>
        <NuxtPage />
    </NuxtLayout>
</template>

<script lang="ts" setup>
// 默认页面信息
useSeoMeta({ title: "finai" });
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
