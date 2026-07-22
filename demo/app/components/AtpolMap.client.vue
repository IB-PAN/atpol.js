<script setup lang="ts">
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FullScreen } from "leaflet.fullscreen";
import "leaflet.fullscreen/dist/Control.FullScreen.css";

import { ATPOL } from "../../../main";

const props = withDefaults(defineProps<{
	bounds: ATPOL.Bounds_LatLon | null;
	marker?: ATPOL.LatLon | null;
	// Interactive mode: highlights the ATPOL square under the cursor, shows a
	// GPS-coordinates/grid-code readout, and emits `hover`/`select` events.
	interactive?: boolean;
	gridLength?: number;
	gridDiv?: null | "D" | "C" | "P";
	initialView?: { center: ATPOL.LatLon; zoom: number };
	mapClass?: string;
}>(), {
	marker: null,
	interactive: false,
	gridLength: 8,
	gridDiv: null,
	initialView: undefined,
	mapClass: "h-72 w-full",
});

const emit = defineEmits<{
	hover: [payload: { latlon: ATPOL.LatLon; grid: string } | null];
	select: [payload: { latlon: ATPOL.LatLon; grid: string }];
	viewchange: [payload: { center: ATPOL.LatLon; zoom: number }];
}>();

const mapEl = useTemplateRef<HTMLElement>("mapEl");
let leafletMap: L.Map | null = null;
let leafletPolygon: L.Polygon | null = null;
let leafletMarker: L.CircleMarker | null = null;
let hoverPolygon: L.Polygon | null = null;
let hoverDiv: HTMLDivElement | null = null;

const baseMaps = {
	OpenStreetMap: L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
		maxZoom: 19,
		attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
	}),
	Satellite: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
		attribution: "&copy; Esri",
	}),
	Topo: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
		attribution: "&copy; Esri",
	}),
	OpenTopoMap: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
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

	if (props.bounds) drawPolygon(props.bounds);
	if (props.marker) drawMarker(props.marker);
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
	hoverPolygon = null;
	hoverDiv = null;
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
		const { grid } = ATPOL.xy_to_grid(xy, props.gridLength, props.gridDiv);
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
