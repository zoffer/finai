<template>
    <div class="tooltip-container relative">
        <slot></slot>
        <div
            class="tooltip absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg shadow-lg opacity-0 invisible transition-all duration-200 bg-bg text-text text-xs z-50">
            <slot name="tooltip-content"></slot>
        </div>
    </div>
</template>

<style scoped>
.tooltip-container:hover .tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateY(-4px);
}

.tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 4px;
    border-style: solid;
    border-color: var(--color-bg) transparent transparent transparent;
}
</style>
