<template>
    <div ref="chartContainer"></div>
</template>

<script setup lang="ts">
import { createChart, CandlestickSeries } from "lightweight-charts";
import type { IChartApi, CandlestickData, TimeChartOptions, CandlestickStyleOptions, SeriesOptionsCommon, DeepPartial } from "lightweight-charts";
import { useMediaQuery } from '@vueuse/core'
import { TooltipPrimitive } from "./plugins/tooltip";

const props = defineProps<{
    data?: CandlestickData[];
}>();

const chartContainer = ref<HTMLDivElement>();

const isPreferredDark = useMediaQuery('(prefers-color-scheme: dark)')

onMounted(() => {
    // https://tradingview.github.io/lightweight-charts/docs
    const getProperties = () => {
        const style = getComputedStyle(chartContainer.value as Element);
        return {
            upColor: style.getPropertyValue('--color-up') || "red",
            downColor: style.getPropertyValue('--color-down') || "green",
            textColor: style.getPropertyValue('--color-text') || "gray"
        };
    }

    const cssProperties = getProperties();
    const getOptions = (p: { textColor: string }): DeepPartial<TimeChartOptions> => {
        return {
            autoSize: true,
            timeScale: {
                fixLeftEdge: true,
                fixRightEdge: true,
                borderVisible: false,
                rightOffset: 8,
            },
            layout: {
                attributionLogo: false,
                textColor: p.textColor,
                background: { color: "transparent" },
            },
        }
    }
    const getSeriesOptions = (p: { upColor: string, downColor: string, textColor: string }): DeepPartial<CandlestickStyleOptions & SeriesOptionsCommon> => {
        return {
            downColor: p.downColor,
            upColor: p.upColor,
            borderVisible: false,
            wickUpColor: p.upColor,
            wickDownColor: p.downColor,
        }
    }
    const chart = createChart(chartContainer.value as HTMLElement, getOptions(cssProperties));
    onBeforeUnmount(() => {
        chart.remove();
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, getSeriesOptions(cssProperties));

    candlestickSeries.attachPrimitive(new TooltipPrimitive());

    const timeScale = chart.timeScale();

    watch(
        () => props.data,
        (newData) => {
            if (newData) {
                const data = [...newData].sort((a, b) => (a.time > b.time ? 1 : -1));
                candlestickSeries.setData(data);
                timeScale.fitContent();
            }
        },
        { immediate: true },
    );

    watch(isPreferredDark, (newVal) => {
        const css = getProperties();
        chart.applyOptions(getOptions(css));
        candlestickSeries.applyOptions(getSeriesOptions(css));
    })
});
</script>
