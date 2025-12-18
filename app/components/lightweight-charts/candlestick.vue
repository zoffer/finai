<template>
    <div ref="chartContainer"></div>
</template>

<script setup lang="ts">
import { createChart, CandlestickSeries, BaselineSeries, LineStyle, LineType } from 'lightweight-charts'
import type { IChartApi, CandlestickData, LineData, } from 'lightweight-charts'
import { TooltipPrimitive } from './plugins/tooltip'

const props = defineProps<{
    data?: CandlestickData[]
    lineData?: LineData[]
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
        overlayPriceScales: {
            minimumWidth: 10,
        },
    })

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
        downColor, upColor, borderVisible: false,
        wickUpColor: upColor, wickDownColor: downColor,
    });

    candlestickSeries.attachPrimitive(new TooltipPrimitive());

    const newsLineSeries = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: 0 },
        lastValueVisible: false,
        priceLineVisible: false,
        lineWidth: 1,
        lineType: LineType.Curved,
        lineStyle: LineStyle.Solid,
        topLineColor: 'rgb(255, 0, 0, 0.2)',
        topFillColor1: 'rgb(255, 0, 0, 0.2)',
        topFillColor2: 'rgb(255, 0, 0, 0)',
        bottomLineColor: 'rgb(0, 255, 0, 0.2)',
        bottomFillColor1: 'rgb(0, 255, 0, 0.2)',
        bottomFillColor2: 'rgb(0, 255, 0, 0)',
    })


    watch(
        () => props.data,
        newData => {
            if (newData) {
                const data = [...newData].sort((a, b) => a.time > b.time ? 1 : -1)
                candlestickSeries.setData(data);
            } else {
                candlestickSeries.setData([])
            }
        },
        { immediate: true }
    );

    watch(
        () => props.lineData,
        newData => {
            if (newData) {
                const data = [...newData].sort((a, b) => a.time > b.time ? 1 : -1)
                newsLineSeries.setData(data);
            } else {
                newsLineSeries.setData([])
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