<script setup lang="ts">
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FullScreen } from "leaflet.fullscreen";
import "leaflet.fullscreen/dist/Control.FullScreen.css";

import type { ATPOL } from "../../../main.ts";

const props = defineProps<{
	bounds: ATPOL.Bounds_LatLon | null;
	marker?: ATPOL.LatLon | null;
}>();

const mapEl = useTemplateRef<HTMLElement>("mapEl");
let leafletMap: L.Map | null = null;
let leafletPolygon: L.Polygon | null = null;
let leafletMarker: L.CircleMarker | null = null;

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

onMounted(() => {
	if (!mapEl.value) return;

	leafletMap = L.map(mapEl.value, { center: [52, 19], zoom: 6 });

	leafletMap.attributionControl.setPrefix(false);

	baseMaps["OpenStreetMap"]!.addTo(leafletMap);

	L.control.layers(baseMaps, undefined, { position: "topright" }).addTo(leafletMap);

	new FullScreen().addTo(leafletMap);

	if (props.bounds) drawPolygon(props.bounds);
	if (props.marker) drawMarker(props.marker);
});

onUnmounted(() => {
	leafletMap?.remove();
	leafletMap = null;
	leafletPolygon = null;
	leafletMarker = null;
});

function drawPolygon(bounds: Bounds) {
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

function drawMarker(latlon: LatLon) {
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
</script>

<template>
	<div class="rounded-lg overflow-hidden border border-default">
		<div
			ref="mapEl"
			class="h-72 w-full"
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
</style>
