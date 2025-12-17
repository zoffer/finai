<template>
    <div ref="chartContainer"></div>
</template>

<script setup lang="ts">
import { createChart, CandlestickSeries } from 'lightweight-charts'
import type { IChartApi, CandlestickData } from 'lightweight-charts'

const props = defineProps<{
    data?: CandlestickData[]
}>()

const chartContainer = ref<HTMLDivElement>()

let chart: IChartApi | null = null

onMounted(() => {
    const upColor = '#ef5350'
    const downColor = '#26a69a'
    chart = createChart(chartContainer.value as HTMLElement, {
        autoSize: true,
        timeScale: {
            fixLeftEdge: true,
            fixRightEdge: true,
            borderVisible: false,
        },
        rightPriceScale: {
            borderVisible: false,
            visible: false,
        },
        layout: {
            attributionLogo: false,
        },
    })

    chart.subscribeCrosshairMove(params => {
        console.log(params)
    })
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
        downColor, upColor, borderVisible: false,
        wickUpColor: upColor, wickDownColor: downColor,
    });

    watch(
        () => props.data,
        newData => {
            if (newData) {
                candlestickSeries.setData(newData);
            } else {
                candlestickSeries.setData([])
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