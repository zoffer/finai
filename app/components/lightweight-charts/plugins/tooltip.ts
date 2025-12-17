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

export class TooltipPrimitive implements ISeriesPrimitive<Time>, IPrimitivePaneView, IPrimitivePaneRenderer {
    private attachedParam: SeriesAttachedParameter<Time> | undefined;
    private point?: MouseEventParams['point'];
    private data?: BarData;
    private onCrosshairMove?: MouseEventHandler<Time>;
    get chart() {
        return this.attachedParam?.chart;
    }

    attached(param: SeriesAttachedParameter<Time>): void {
        this.attachedParam = param;
        const series = param.series;
        this.onCrosshairMove = (event) => {
            const old = this.data;
            this.point = event.point;
            this.data = event.seriesData.get(series) as BarData;
            if (old !== this.data) {
                param.requestUpdate();
            }
        };
        param.chart.applyOptions({
            leftPriceScale: {
                visible: false,
            },
            rightPriceScale: {
                visible: false,
            },
        });
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
        return "normal";
    }
    renderer() {
        return this;
    }
    draw(target: Parameters<IPrimitivePaneRenderer['draw']>[0]) {
        const h = 20;
        if (!this.point || !this.data || !this.attachedParam) { return; }
        const { x } = this.point;
        const { open, close } = this.data;
        const { upColor = "red", downColor = "green" } = this.attachedParam.series.options() as { upColor?: string, downColor?: string }
        // target is an instance of CanvasRenderingTarget2D
        target.useMediaCoordinateSpace(scope => {
            // scope is an instance of BitmapCoordinatesRenderingScope
            const { context } = scope;

            // example of drawing text
            context.font = '12px sans-serif';
            context.fillStyle = close > open ? upColor : open > close ? downColor : "gray";
            context.textAlign = 'center';
            context.fillText(close.toFixed(2), x, h / 2);
        });
    }

}