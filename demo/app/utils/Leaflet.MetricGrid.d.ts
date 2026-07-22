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
		/** Label text size in px, and the line height used to place labels */
		fontSize?: number;
		/** CSS font-family list, e.g. "Verdana" or "ui-monospace, monospace" */
		fontFamily?: string;
		/** CSS font-weight, e.g. "bold" or "600" */
		fontWeight?: string;
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

	interface AtpolGridOptions extends Omit<MetricGridOptions, "proj4ProjDef" | "bounds"> {
		proj4ProjDef: MetricGridOptions["proj4ProjDef"];
		/** ATPOL km, [[minX, minY], [maxX, maxY]] with y growing south */
		bounds: [[number, number], [number, number]];
		/** Per 100 km row (y / 100), the [first, last + 1] column index covered */
		region?: [number, number][];
		/** Standard ATPOL square sizes in km, coarsest first */
		levels?: number[];
		/** Minimum on-screen square size (px) before switching to a finer level */
		minCellPx?: number;
		/** Squares smaller than this (px) are left unlabelled */
		minLabelCellPx?: number;
		labelPadding?: number;
		/** Line width for the enclosing 10x coarser level */
		majorWeight?: number;
		/** Halo drawn behind label text, or null for none */
		labelHalo?: string | null;
		showLabels?: boolean;
	}

	class AtpolGrid extends MetricGrid {
		constructor(options?: Partial<AtpolGridOptions>);
	}

	function atpolGrid(options?: Partial<AtpolGridOptions>): AtpolGrid;
}
