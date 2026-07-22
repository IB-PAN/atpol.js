<script setup lang="ts">
import { ATPOL } from "../../../main";
import { gridSizes, GRID_CONFIG, type GridSizeKey } from "~/utils/grid-sizes";
import AtpolMap from "~/components/AtpolMap.client.vue";

useSeoMeta({
	title: "Mapa",
	description: "Interaktywna mapa siatki ATPOL — najedź na kwadrat, aby zobaczyć jego kod, kliknij, aby przeliczyć go na współrzędne.",
});

const DEFAULT_CENTER: ATPOL.LatLon = { lat: 52, lon: 19 };
const DEFAULT_ZOOM = 6;
const DEFAULT_GRID_SIZE: GridSizeKey = "100km";

// ---- URL hash: "lat,lon,zoom,gridSize" ----
// Read/written through useRoute()/navigateTo() rather than the raw History
// API: a raw `history.replaceState` clobbers the state object vue-router
// attaches to each entry (position/scroll bookkeeping), which broke the
// browser Back button restoring this page's view after following a square
// to the calculator page. Going through the router keeps that state intact.

const route = useRoute();

function parseHash(hash: string): { center: ATPOL.LatLon; zoom: number; gridSize: GridSizeKey } | null {
	const raw = hash.startsWith("#") ? hash.slice(1) : hash;
	if (!raw) return null;
	const [latStr, lonStr, zoomStr, sizeStr] = raw.split(",");
	if (!latStr || !lonStr || !zoomStr || !sizeStr) return null;
	const lat = parseFloat(latStr);
	const lon = parseFloat(lonStr);
	const zoom = parseInt(zoomStr, 10);
	if (isNaN(lat) || isNaN(lon) || isNaN(zoom)) return null;
	if (!(sizeStr in GRID_CONFIG)) return null;
	return { center: { lat, lon }, zoom, gridSize: sizeStr as GridSizeKey };
}

const fromHash = parseHash(route.hash);

const gridSize = ref<GridSizeKey>(fromHash?.gridSize ?? DEFAULT_GRID_SIZE);
const drawGridLines = ref(true);

// Read once: AtpolMap only applies `initialView` when it creates its Leaflet
// instance, not reactively.
const initialView = {
	center: fromHash?.center ?? DEFAULT_CENTER,
	zoom: fromHash?.zoom ?? DEFAULT_ZOOM,
};

let currentView = { ...initialView };

const mapRef = useTemplateRef<InstanceType<typeof AtpolMap>>("mapRef");

const gridConfig = computed(() => GRID_CONFIG[gridSize.value]);
const gridLength = computed(() => gridConfig.value.length);
const gridDiv = computed(() => "div" in gridConfig.value ? gridConfig.value.div : null);

// Derived from the dropdown itself so the +/- order always matches what's shown.
const sizeKeys = gridSizes.flatMap((item) => {
	if (item && typeof item === "object" && "value" in item && typeof item.value === "string") {
		return [item.value as GridSizeKey];
	}
	return [];
});

const sizeIndex = computed(() => sizeKeys.indexOf(gridSize.value));
const canGrowGrid = computed(() => sizeIndex.value < sizeKeys.length - 1);
const canShrinkGrid = computed(() => sizeIndex.value > 0);

function stepGridSize(delta: number) {
	const idx = sizeIndex.value + delta;
	const next = sizeKeys[idx];
	if (!next) return;
	gridSize.value = next;
}

// Set whenever we write the hash ourselves, so the route.hash watcher below
// can tell "we just navigated" apart from "the user edited the address bar"
// and skip re-applying a change that already originated from this page.
let lastWrittenHash: string | null = null;

function updateHash() {
	const { center, zoom } = currentView;
	const hash = `#${center.lat.toFixed(5)},${center.lon.toFixed(5)},${zoom},${gridSize.value}`;
	lastWrittenHash = hash;
	navigateTo({ path: "/map/", hash }, { replace: true });
}

function onViewChange(payload: { center: ATPOL.LatLon; zoom: number }) {
	currentView = payload;
	updateHash();
}

watch(gridSize, updateHash);

// Only establish a hash if the page was opened without one - if we arrived
// with one (fresh load or restored via Back), leave it alone.
onMounted(() => {
	if (!route.hash) updateHash();
});

// React to the hash being changed by something other than updateHash() above
// (typically the user editing it by hand in the address bar) by moving the
// map and updating the grid-size dropdown to match.
watch(() => route.hash, (hash) => {
	if (hash === lastWrittenHash) return;
	const parsed = parseHash(hash);
	if (!parsed) return;
	currentView = { center: parsed.center, zoom: parsed.zoom };
	gridSize.value = parsed.gridSize;
	mapRef.value?.setView(parsed.center, parsed.zoom);
});

function onSelect(payload: { grid: string }) {
	const code = ATPOL.grid_normalize(payload.grid);
	navigateTo({ path: "/calculator-from-grid-code/", hash: `#${code}` });
}
</script>

<template>
	<div class="flex flex-col h-[calc(100dvh-4rem-3rem)] lg:h-[calc(100dvh-4rem-4rem)]">
		<div class="mb-4 shrink-0">
			<div class="flex items-center gap-2 mb-1">
				<UIcon
					name="i-lucide-map"
					class="text-primary size-6 shrink-0"
				/>
				<h1 class="text-2xl font-bold">
					Mapa
				</h1>
			</div>
			<p class="text-muted">
				Najedź kursorem na mapę, aby zobaczyć kod kwadratu ATPOL wybranej wielkości. Kliknij kwadrat, aby przeliczyć go na współrzędne.
			</p>
		</div>

		<UCard class="mb-4 shrink-0">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<UFormField label="Wielkość siatki do zaznaczenia">
					<div class="flex items-center gap-2">
						<USelect
							v-model="gridSize"
							:items="gridSizes"
							class="w-full sm:w-72"
						/>
						<UButton
							icon="i-lucide-minus"
							color="neutral"
							variant="outline"
							size="sm"
							aria-label="Większy kwadrat siatki"
							:disabled="!canShrinkGrid"
							@click="stepGridSize(-1)"
						/>
						<UButton
							icon="i-lucide-plus"
							color="neutral"
							variant="outline"
							size="sm"
							aria-label="Mniejszy kwadrat siatki"
							:disabled="!canGrowGrid"
							@click="stepGridSize(1)"
						/>
					</div>
				</UFormField>
				<UCheckbox
					v-model="drawGridLines"
					label="Siatka ATPOL na mapie"
					description="Rysuj linie referencyjne 100/10/1 km&#10;(niezależne od wielkości wybranej obok)"
					class="sm:self-center"
				/>
			</div>
		</UCard>

		<AtpolMap
			ref="mapRef"
			:bounds="null"
			:interactive="true"
			:interactive-grid-length="gridLength"
			:interactive-grid-div="gridDiv"
			:draw-atpol-grid-lines="drawGridLines"
			:initial-view="initialView"
			map-class="h-full w-full"
			class="flex-1 min-h-0"
			@select="onSelect"
			@viewchange="onViewChange"
		/>
	</div>
</template>
