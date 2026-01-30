<template>
    <div ref="chartContainer"></div>
</template>

<script setup lang="ts">
import { createChart, CandlestickSeries, BaselineSeries, LineStyle } from 'lightweight-charts'
import type { IChartApi, CandlestickData } from 'lightweight-charts'
import { TooltipPrimitive } from './plugins/tooltip'

const props = defineProps<{
    data?: CandlestickData[]
}>()

const chartContainer = ref<HTMLDivElement>()

let chart: IChartApi | null = null

onMounted(() => {
    const upColor = '#ef4444'
    const downColor = '#22c55e'
    chart = createChart(chartContainer.value as HTMLElement, {
        autoSize: true,
        timeScale: {
            fixLeftEdge: true,
            fixRightEdge: true,
            borderVisible: false,
            rightOffset: 8,
        },
        layout: {
            attributionLogo: false,
        },
    })

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
        downColor, upColor, borderVisible: false,
        wickUpColor: upColor, wickDownColor: downColor,
    });

    candlestickSeries.attachPrimitive(new TooltipPrimitive());

    const timeScale = chart.timeScale()

    watch(
        () => props.data,
        newData => {
            if (newData) {
                const data = [...newData].sort((a, b) => a.time > b.time ? 1 : -1)
                candlestickSeries.setData(data);
                timeScale.fitContent()
            }
        },
        { immediate: true }
    );


})
onBeforeUnmount(() => {
    if (chart) {
        chart.remove()
        chart = null
    }
})
</script>