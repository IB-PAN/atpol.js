import "leaflet";

declare module "leaflet" {
	interface MetricGridOptions extends LayerOptions {
		proj4ProjDef: string | {
			forward: (lonlat: [number, number]) => [number, number];
			inverse: (xy: [number, number]) => [number, number];
		};
		bounds: [[number, number], [number, number]];
		clip?: [number, number][] | null;
		latLonClipBounds?: LatLngBoundsExpression | null;
		drawClip?: boolean;
		hundredKmSquareFunc?: (e: number, n: number) => string;
		showAxisLabels?: number[];
		showAxis100km?: boolean;
		showSquareLabels?: number[];
		opacity?: number;
		weight?: number;
		color?: string;
		fontColor?: string;
		font?: string;
		density?: number;
		minInterval?: number;
		maxInterval?: number;
		minZoom?: number;
		skipZoom?: number[];
	}

	class MetricGrid extends Layer {
		constructor(options: MetricGridOptions);
		setOpacity(opacity: number): this;
		bringToFront(): this;
		bringToBack(): this;
	}
}
