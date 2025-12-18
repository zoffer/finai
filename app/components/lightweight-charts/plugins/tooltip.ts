import type {
    IPrimitivePaneRenderer,
    IPrimitivePaneView,
    MouseEventParams,
    PrimitivePaneViewZOrder,
    ISeriesPrimitive,
    SeriesAttachedParameter,
    BarData,
    Time,
    MouseEventHandler,
} from 'lightweight-charts';

export class TooltipPrimitive<T = Time> implements ISeriesPrimitive<T>, IPrimitivePaneView, IPrimitivePaneRenderer {
    private attachedParam: SeriesAttachedParameter<T, 'Candlestick'> | undefined;
    private point?: MouseEventParams['point'];
    private data?: BarData<T>;
    private onCrosshairMove?: MouseEventHandler<T>;

    get chart() {
        return this.attachedParam?.chart;
    }

    attached(param: SeriesAttachedParameter<T, 'Candlestick'>): void {
        this.attachedParam = param;
        const series = param.series;
        param.chart.applyOptions({
            leftPriceScale: {
                visible: false,
            },
            rightPriceScale: {
                visible: false,
            },
        });
        this.onCrosshairMove = (event) => {
            const old = this.data;
            this.point = event.point;
            this.data = event.seriesData.get(series) as BarData<T>;
            if (old !== this.data) {
                param.requestUpdate();
            }
        };
        param.chart.subscribeCrosshairMove(this.onCrosshairMove);
    }

    detached(): void {
        if (this.onCrosshairMove) {
            this.chart?.unsubscribeCrosshairMove(this.onCrosshairMove);
        }
    }
    paneViews(): IPrimitivePaneView[] {
        return [this];
    }
    zOrder(): PrimitivePaneViewZOrder {
        return "top";
    }
    renderer() {
        return this;
    }
    draw(target: Parameters<IPrimitivePaneRenderer['draw']>[0]) {
        if (!this.point || !this.data || !this.attachedParam) { return; }
        const { x: originX } = this.point;
        const { open, close } = this.data;
        const { upColor = "red", downColor = "green" } = this.attachedParam.series.options()
        const color = close > open ? upColor : open > close ? downColor : "gray";
        // target is an instance of CanvasRenderingTarget2D
        target.useMediaCoordinateSpace(scope => {
            const fontSize = 12;
            const padding = 5;
            const text = close.toFixed(2);
            const { context } = scope;
            context.font = `${fontSize}px sans-serif`;
            const w = context.measureText(text).width + 2 * padding;
            const h = fontSize + padding * 2;
            const x = Math.min(Math.max(0, originX - w / 2), scope.mediaSize.width - w);
            context.fillStyle = color;
            context.fillRect(x, 0, w, h);
            context.fillStyle = 'white';
            context.textAlign = 'left';
            context.textBaseline = 'top';
            context.fillText(text, x + padding, padding);
        });
    }

}