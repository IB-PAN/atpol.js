<script setup lang="ts">
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FullScreen } from "leaflet.fullscreen";
import "leaflet.fullscreen/dist/Control.FullScreen.css";
import "~/utils/Leaflet.MetricGrid.js";

import { ATPOL } from "../../../main";

const props = withDefaults(defineProps<{
	bounds: ATPOL.Bounds_LatLon | null;
	marker?: ATPOL.LatLon | null;
	// A single point to call out on the map, e.g. the corner belonging to the
	// row currently hovered in a sibling AtpolBoundsTable.
	highlight?: { point: ATPOL.LatLon; label: string } | null;
	// The rounded bounding box of a sibling AtpolBoundsTable's geographic
	// coverage tab, drawn as four dashed lines running across the whole map.
	// `highlighted` names the ones whose cell is currently hovered.
	geoCoverage?: { south: number; north: number; west: number; east: number; highlighted: string[] } | null;
	// Interactive mode: highlights the ATPOL square under the cursor, shows a
	// GPS-coordinates/grid-code readout, and emits `hover`/`select` events.
	interactive?: boolean;
	interactiveGridLength?: number;
	interactiveGridDiv?: null | "D" | "C" | "P";
	// Draws the ATPOL 100km/10km/1km/100m grid lines over the whole map.
	// Unrelated to interactiveGridLength/interactiveGridDiv, which only size
	// the single hovered/selected square.
	drawAtpolGridLines?: boolean;
	initialView?: { center: ATPOL.LatLon; zoom: number };
	mapClass?: string;
}>(), {
	marker: null,
	highlight: null,
	geoCoverage: null,
	interactive: false,
	interactiveGridLength: 8,
	interactiveGridDiv: null,
	drawAtpolGridLines: false,
	initialView: undefined,
	mapClass: "h-72 w-full",
});

const emit = defineEmits<{
	hover: [payload: { latlon: ATPOL.LatLon; grid: string } | null];
	select: [payload: { latlon: ATPOL.LatLon; grid: string }];
	viewchange: [payload: { center: ATPOL.LatLon; zoom: number }];
}>();

// Lets the parent move the map programmatically (e.g. reacting to the URL
// hash being edited by hand) without going through initialView, which only
// applies once at map creation.
defineExpose({
	setView(center: ATPOL.LatLon, zoom: number) {
		leafletMap?.setView([center.lat, center.lon], zoom);
	},
});

const mapEl = useTemplateRef<HTMLElement>("mapEl");
let leafletMap: L.Map | null = null;
let leafletPolygon: L.Polygon | null = null;
let leafletMarker: L.CircleMarker | null = null;
let highlightMarker: L.CircleMarker | null = null;
let hoverPolygon: L.Polygon | null = null;
let hoverDiv: HTMLDivElement | null = null;
const geoCoverageLines = new Map<string, L.Polyline>();
let atpolGridLayer: L.Layer | null = null;

const baseMaps = {
	"OpenStreetMap": L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
		maxZoom: 19,
		attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
	}),
	"Satellite (Esri)": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
		attribution: "&copy; Esri",
	}),
	"Topo (Esri)": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
		attribution: "&copy; Esri",
	}),
	"OpenTopoMap": L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
		maxZoom: 17,
		attribution: "&copy; <a href=\"https://opentopomap.org/\">OpenTopoMap</a>",
	}),
};

function createHoverControl(): L.Control {
	const control = new L.Control({ position: "bottomleft" });
	control.onAdd = () => {
		hoverDiv = L.DomUtil.create("div", "atpol-hover-info");
		hoverDiv.style.display = "none";
		L.DomEvent.disableClickPropagation(hoverDiv);
		return hoverDiv;
	};
	return control;
}

function initMap(el: HTMLElement) {
	if (leafletMap) return;

	const view = props.initialView;
	leafletMap = L.map(el, { center: view ? [view.center.lat, view.center.lon] : [52, 19], zoom: view?.zoom ?? 6 });

	leafletMap.attributionControl.setPrefix(false);

	baseMaps["OpenStreetMap"]!.addTo(leafletMap);

	L.control.layers(baseMaps, undefined, { position: "topright" }).addTo(leafletMap);

	new FullScreen().addTo(leafletMap);

	if (props.interactive) {
		createHoverControl().addTo(leafletMap);
		leafletMap.on("mousemove", e => updateHover(e.latlng));
		leafletMap.on("mouseout", () => clearHover());
		leafletMap.on("click", (e) => {
			updateHover(e.latlng);
			if (hoverState) emit("select", hoverState);
		});
	}

	leafletMap.on("moveend", () => {
		if (!leafletMap) return;
		const center = leafletMap.getCenter();
		emit("viewchange", { center: { lat: center.lat, lon: center.lng }, zoom: leafletMap.getZoom() });
	});

	if (props.drawAtpolGridLines) atpolGridLayer = L.atpolGrid().addTo(leafletMap);

	if (props.bounds) drawPolygon(props.bounds);
	if (props.marker) drawMarker(props.marker);
	if (props.highlight) drawHighlight(props.highlight);
	if (props.geoCoverage) drawGeoCoverage(props.geoCoverage);
}

// Watch the ref instead of using onMounted: when this component is created
// as a side effect of the parent's own onMounted (e.g. applying a grid code
// from the URL hash right after the page mounts), this component's onMounted
// can fire before the template ref is actually bound, silently skipping map
// creation for good. Watching the ref fires as soon as it's actually set.
watch(mapEl, (el) => {
	if (el) initMap(el);
}, { immediate: true });

onUnmounted(() => {
	leafletMap?.remove();
	leafletMap = null;
	leafletPolygon = null;
	leafletMarker = null;
	highlightMarker = null;
	hoverPolygon = null;
	hoverDiv = null;
	geoCoverageLines.clear();
	atpolGridLayer = null;
});

function drawPolygon(bounds: ATPOL.Bounds_LatLon) {
	if (!leafletMap) return;

	leafletPolygon?.remove();

	leafletPolygon = L.polygon(
		[
			[bounds.nw.lat, bounds.nw.lon],
			[bounds.ne.lat, bounds.ne.lon],
			[bounds.se.lat, bounds.se.lon],
			[bounds.sw.lat, bounds.sw.lon],
		],
		{ className: "atpol-polygon" },
	).addTo(leafletMap);

	leafletMap.fitBounds(leafletPolygon.getBounds(), { padding: [28, 28] });
}

function drawMarker(latlon: ATPOL.LatLon) {
	if (!leafletMap) return;

	leafletMarker?.remove();

	leafletMarker = L.circleMarker([latlon.lat, latlon.lon], {
		radius: 7,
		fillColor: "#ef4444",
		color: "#fff",
		weight: 2,
		fillOpacity: 1,
		className: "atpol-gps-marker",
	}).bindTooltip(`φ ${latlon.lat.toFixed(6)}, λ ${latlon.lon.toFixed(6)}`)
		.addTo(leafletMap);
}

function drawHighlight(highlight: { point: ATPOL.LatLon; label: string }) {
	if (!leafletMap) return;

	highlightMarker?.remove();

	highlightMarker = L.circleMarker([highlight.point.lat, highlight.point.lon], {
		radius: 8,
		fillColor: "#f59e0b",
		color: "#fff",
		weight: 2,
		fillOpacity: 1,
		className: "atpol-highlight-marker",
		interactive: false,
	}).bindTooltip(highlight.label, {
		permanent: true,
		direction: "top",
		className: "atpol-highlight-tooltip",
	}).addTo(leafletMap);
}

function clearHighlight() {
	highlightMarker?.remove();
	highlightMarker = null;
}

// Each line is drawn from pole to pole / all the way around the globe, so it
// keeps spanning the viewport at any pan or zoom without ever being redrawn.
// Existing lines are moved rather than recreated: the values change on every
// step of the rounding slider, and recreating would flicker and would restart
// the highlight transition.
function drawGeoCoverage(coverage: NonNullable<typeof props.geoCoverage>) {
	if (!leafletMap) return;

	const defs: { key: string; latlngs: L.LatLngExpression[] }[] = [
		{ key: "south", latlngs: [[coverage.south, -180], [coverage.south, 180]] },
		{ key: "north", latlngs: [[coverage.north, -180], [coverage.north, 180]] },
		{ key: "west", latlngs: [[-85, coverage.west], [85, coverage.west]] },
		{ key: "east", latlngs: [[-85, coverage.east], [85, coverage.east]] },
	];

	for (const def of defs) {
		let line = geoCoverageLines.get(def.key);
		if (line) {
			line.setLatLngs(def.latlngs);
		} else {
			line = L.polyline(def.latlngs, { className: "atpol-coverage-line", interactive: false }).addTo(leafletMap);
			geoCoverageLines.set(def.key, line);
		}
		line.getElement()?.classList.toggle("atpol-coverage-line-active", coverage.highlighted.includes(def.key));
	}
}

function clearGeoCoverage() {
	for (const line of geoCoverageLines.values()) line.remove();
	geoCoverageLines.clear();
}

watch(() => props.bounds, (bounds) => {
	if (bounds) {
		drawPolygon(bounds);
	} else {
		leafletPolygon?.remove();
		leafletPolygon = null;
		leafletMap?.setView([52, 19], 6);
	}
});

watch(() => props.marker, (marker) => {
	if (marker) {
		drawMarker(marker);
	} else {
		leafletMarker?.remove();
		leafletMarker = null;
	}
});

watch(() => props.highlight, (highlight) => {
	if (highlight) {
		drawHighlight(highlight);
	} else {
		clearHighlight();
	}
});

watch(() => props.geoCoverage, (coverage) => {
	if (coverage) {
		drawGeoCoverage(coverage);
	} else {
		clearGeoCoverage();
	}
});

watch(() => props.drawAtpolGridLines, (draw) => {
	if (!leafletMap) return;
	if (draw) {
		atpolGridLayer = L.atpolGrid().addTo(leafletMap);
	} else {
		atpolGridLayer?.remove();
		atpolGridLayer = null;
	}
});

// ---- Interactive hover highlighting ----

let hoverState: { latlon: ATPOL.LatLon; grid: string } | null = null;

function updateHover(latlng: L.LatLng) {
	const latlon = { lat: latlng.lat, lon: latlng.lng };
	try {
		const xy = ATPOL.latlon_to_xy(latlon);
		if (!(xy.x >= 0 && xy.x <= 700 && xy.y >= 0 && xy.y <= 700)) {
			clearHover();
			return;
		}
		const { grid } = ATPOL.xy_to_grid(xy, props.interactiveGridLength, props.interactiveGridDiv);
		hoverState = { latlon, grid };
		drawHoverPolygon(ATPOL.grid_to_latlon_bounds(grid));
		renderHoverInfo(latlon, grid);
		emit("hover", hoverState);
	} catch {
		clearHover();
	}
}

function clearHover() {
	if (!hoverState) return;
	hoverState = null;
	hoverPolygon?.remove();
	hoverPolygon = null;
	if (hoverDiv) hoverDiv.style.display = "none";
	emit("hover", null);
}

function drawHoverPolygon(bounds: ATPOL.Bounds_LatLon) {
	if (!leafletMap) return;

	hoverPolygon?.remove();

	hoverPolygon = L.polygon(
		[
			[bounds.nw.lat, bounds.nw.lon],
			[bounds.ne.lat, bounds.ne.lon],
			[bounds.se.lat, bounds.se.lon],
			[bounds.sw.lat, bounds.sw.lon],
		],
		{ className: "atpol-hover-polygon", interactive: false },
	).addTo(leafletMap);
}

function renderHoverInfo(latlon: ATPOL.LatLon, grid: string) {
	if (!hoverDiv) return;
	hoverDiv.replaceChildren();

	const coordLine = document.createElement("div");

	const gridLine = document.createElement("div");
	gridLine.className = "atpol-hover-info-grid";
	gridLine.textContent = ATPOL.grid_normalize(grid, " ");
	hoverDiv.append(coordLine, gridLine);

	const coordsLine = `φ ${latlon.lat.toFixed(6)}, λ ${latlon.lon.toFixed(6)}`;
	hoverDiv.append(coordLine, coordsLine);

	hoverDiv.style.display = "block";
}
</script>

<template>
	<div class="relative rounded-lg overflow-hidden border border-default">
		<div
			ref="mapEl"
			:class="mapClass"
		/>
	</div>
</template>

<style>
.atpol-polygon {
	stroke: var(--color-primary);
	stroke-width: 2;
	fill: var(--color-primary);
	fill-opacity: 0.12;
}

.atpol-hover-polygon {
	stroke: var(--ui-text-highlighted, #f59e0b);
	stroke-width: 2;
	stroke-dasharray: 4 3;
	fill: var(--ui-text-highlighted, #f59e0b);
	fill-opacity: 0.15;
	pointer-events: none;
}

.atpol-coverage-line {
	stroke: var(--ui-text-muted, #6b7280);
	stroke-width: 2;
	stroke-dasharray: 6 6;
	stroke-opacity: 0.7;
	fill: none;
	pointer-events: none;
	transition: stroke 0.15s, stroke-width 0.15s, stroke-opacity 0.15s;
}

.atpol-coverage-line-active {
	stroke: #f59e0b;
	stroke-width: 3.5;
	stroke-opacity: 1;
}

.atpol-highlight-marker {
	transform-box: fill-box;
	transform-origin: center;
	animation: atpol-highlight-pulse 1.2s ease-in-out infinite;
}

@keyframes atpol-highlight-pulse {
	0%, 100% { transform: scale(1); }
	50% { transform: scale(1.3); }
}

@media (prefers-reduced-motion: reduce) {
	.atpol-highlight-marker {
		animation: none;
	}
}

.leaflet-tooltip.atpol-highlight-tooltip {
	background: #f59e0b;
	border: none;
	color: #fff;
	font-weight: 700;
	font-size: 0.7rem;
	letter-spacing: 0.03em;
	padding: 1px 6px;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}

.leaflet-tooltip.atpol-highlight-tooltip::before {
	border-top-color: #f59e0b;
}

.atpol-hover-info {
	background: var(--ui-bg-elevated);
	border: 1px solid var(--ui-border);
	border-radius: 6px;
	padding: 4px 8px;
	font-family: ui-monospace, monospace;
	font-size: 0.75rem;
	line-height: 1.3;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
	pointer-events: none;
}

.atpol-hover-info-grid {
	font-weight: 700;
	color: var(--ui-primary);
	font-size: 2rem;
	text-align: center;
}
</style>
