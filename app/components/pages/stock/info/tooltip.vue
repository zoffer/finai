<template>
    <div class="tooltip-container relative">
        <slot></slot>
        <!-- Tooltip 内容 -->
        <div
            class="tooltip absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg shadow-lg opacity-0 invisible transition-all duration-200 bg-white text-gray-800 text-xs z-50">
            <slot name="tooltip-content"></slot>
        </div>
    </div>
</template>

<style scoped>
/* Tooltip 样式 */
.tooltip-container:hover .tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(-4px);
}

/* Tooltip 三角形指示器 */
.tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 4px;
    border-style: solid;
    border-color: white transparent transparent transparent;
}
</style>