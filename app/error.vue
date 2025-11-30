<template>
    <div class="not-found-container">
        <!-- From Uiverse.io by kennyotsu -->
        <div class="container noselect">
            <div class="canvas">
                <div v-for="i in 25" class="tracker"></div>
                <div class="card">
                    <div class="title">
                        <span style="font-size: 3em">{{ code }}</span> <br />
                        <span style="font-size: 1em"> {{ message }} </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps({
    error: Object as () => NuxtError,
});

const code = computed(() => props?.error?.statusCode || 500);
const message = computed(() => props?.error?.statusMessage || "Unknown Error");
</script>

<style lang="scss" scoped>
.not-found-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f9fa;
}

/* From Uiverse.io by kennyotsu */
/*works janky on mobile :<*/
.container {
    position: relative;
    width: min(100vw, 100vh, 320px);
    height: min(100vw, 100vh, 320px);
    transition: 200ms;
    &:active {
        transform: scaleX(0.9) scaleY(1.1);
    }
}

.card {
    position: absolute;
    inset: 0;
    z-index: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 20px;
    transition: 700ms;
    background: linear-gradient(
        43deg,
        rgb(65, 88, 208) 0%,
        rgb(200, 80, 192) 46%,
        rgb(255, 204, 112) 100%
    );

    &::before {
        content: "";
        background: linear-gradient(
            43deg,
            rgb(65, 88, 208) 0%,
            rgb(200, 80, 192) 46%,
            rgb(255, 204, 112) 100%
        );
        filter: blur(2rem);
        opacity: 30%;
        width: 100%;
        height: 100%;
        position: absolute;
        z-index: -1;
        transition: 200ms;
    }
}

.title {
    position: absolute;
    font-weight: bold;
    color: white;
    text-align: center;
    font-size: 32px;
    @media (max-width: 250px) {
        font-size: 16px;
    }
}

.tracker:hover ~ .card {
    transition: 300ms;
    filter: brightness(1.1);
}

.container:hover .card::before {
    transition: 200ms;
    content: "";
    opacity: 80%;
}

.canvas {
    $n: 5;

    perspective: 800px;
    inset: 0;
    z-index: 200;
    position: absolute;
    display: grid;
    grid-template-columns: repeat($n, 1fr);
    grid-template-rows: repeat($n, 1fr);
    gap: 0px 0px;

    .tracker {
        z-index: 200;
    }

    @for $i from 0 to $n {
        @for $j from 0 to $n {
            $x: $i * $n + $j + 1;
            .tracker:nth-child(#{$x}) {
                &:hover ~ .card {
                    transition: 125ms ease-in-out;
                    transform: rotateX(#{10 - $i * 5}deg) rotateY(#{$j * 5 - 10}deg);
                }
            }
        }
    }
}

.noselect {
    -webkit-touch-callout: none;
    /* iOS Safari */
    -webkit-user-select: none;
    /* Safari */
    /* Konqueror HTML */
    -moz-user-select: none;
    /* Old versions of Firefox */
    -ms-user-select: none;
    /* Internet Explorer/Edge */
    user-select: none;
    /* Non-prefixed version, currently supported by Chrome, Edge, Opera and Firefox */
}
</style>
