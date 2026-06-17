<script setup>
import * as ATPOL from "../../../main.ts";
import { dmsToDd } from "~/utils/coord-utils";
import { generateKMLString, generateGeoJSONString, downloadKML, downloadGeoJSON, downloadSHPZip } from "~/utils/atpol-export";

useSeoMeta({
	title: "Kalkulator – współrzędne na kwadrat ATPOL",
	description: "Znajdź kod kwadratu ATPOL na podstawie współrzędnych geograficznych.",
});

const mode = ref("dd");

const form = reactive({
	dd: { lat: "", lon: "" },
	dms: {
		lat: { deg: "", min: "", sec: "" },
		lon: { deg: "", min: "", sec: "" },
	},
	gridSize: "10km",
});

const gridSizes = [
	{ type: "label", label: "Siatka Standardowa" },
	{ label: "100×100 km", value: "100km" },
	{ label: "10×10 km", value: "10km" },
	{ label: "1×1 km", value: "1km" },
	{ label: "100×100 m", value: "100m" },
	{ label: "10×10 m (max)", value: "10m" },
	{ type: "separator" },
	{ type: "label", label: "Nietypowy: 10×10 km" },
	{ label: "5×5 km (typ d)", value: "5km" },
	{ label: "2×2 km (typ p)", value: "2km" },
	{ type: "separator" },
	{ type: "label", label: "Nietypowy: 1×1 km" },
	{ label: "500×500 m (typ d)", value: "500m" },
	{ label: "200×200 m (typ p)", value: "200m" },
	{ type: "separator" },
	{ type: "label", label: "Nietypowy: 100×100 m" },
	{ label: "50×50 m (typ d)", value: "50m" },
	{ label: "20×20 m (typ p)", value: "20m" },
];

const GRID_CONFIG = {
	"100km": { length: 2 },
	"10km": { length: 4 },
	"5km": { length: 4, div: "D", count: 2 },
	"2km": { length: 4, div: "P", count: 5 },
	"1km": { length: 6 },
	"500m": { length: 6, div: "D", count: 2 },
	"200m": { length: 6, div: "P", count: 5 },
	"100m": { length: 8 },
	"50m": { length: 8, div: "D", count: 2 },
	"20m": { length: 8, div: "P", count: 5 },
	"10m": { length: 10 },
};

function computeGridCode(xy, gridSize) {
	const cfg = GRID_CONFIG[gridSize];
	const { grid, xoffset, yoffset } = ATPOL.xy_to_grid(xy, cfg.length);
	if (!cfg.div) return grid;
	const div_y = Math.min(cfg.count - 1, Math.floor(yoffset * cfg.count));
	const div_x = Math.min(cfg.count - 1, Math.floor(xoffset * cfg.count));
	return `${grid}${cfg.div.toLowerCase()}${div_y}${div_x}`;
}

function formatSideLabel(grid) {
	const m = ATPOL.grid_to_square_side_in_meters(grid);
	const sizeStr = m >= 1000 ? `${m / 1000} x ${m / 1000} km` : `${m} x ${m} m`;
	const divMatch = grid.toUpperCase().replace(/\s/g, "").match(/([DCP])\d{2}$/);
	return divMatch ? `${sizeStr} (typ ${divMatch[1].toLowerCase()})` : sizeStr;
}

// ---- GPS ----

const gpsStatus = ref({ state: "idle", text: "", accuracy: 0 });

function getLocation() {
	if (!navigator.geolocation) {
		gpsStatus.value = { state: "error", text: "Twoja przeglądarka nie wspiera geolokalizacji.", accuracy: 0 };
		return;
	}
	gpsStatus.value = { state: "loading", text: "Trwa pobieranie sygnału GPS…", accuracy: 0 };
	navigator.geolocation.getCurrentPosition(
		(pos) => {
			form.dd.lat = pos.coords.latitude.toFixed(6);
			form.dd.lon = pos.coords.longitude.toFixed(6);
			mode.value = "dd";
			gpsStatus.value = { state: "success", text: "", accuracy: Math.round(pos.coords.accuracy) };
		},
		(err) => {
			const msgs = {
				1: "Użytkownik zablokował dostęp do lokalizacji.",
				2: "Sygnał GPS niedostępny.",
				3: "Przekroczono czas oczekiwania na GPS.",
			};
			gpsStatus.value = { state: "error", text: msgs[err.code] || "Wystąpił nieznany błąd lokalizacji.", accuracy: 0 };
		},
		{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
	);
}

// ---- Coordinate parsing ----

const latDD = computed(() => {
	if (mode.value === "dd") {
		const s = form.dd.lat.trim().replace(/,/g, ".");
		if (!s) return null;
		const n = parseFloat(s);
		return isNaN(n) ? null : n;
	}
	const degStr = form.dms.lat.deg.trim();
	if (!degStr) return null;
	const deg = parseFloat(degStr.replace(/,/g, "."));
	if (isNaN(deg)) return null;
	const min = parseFloat(form.dms.lat.min.trim().replace(/,/g, ".")) || 0;
	const sec = parseFloat(form.dms.lat.sec.trim().replace(/,/g, ".")) || 0;
	return dmsToDd(deg, min, sec);
});

const lonDD = computed(() => {
	if (mode.value === "dd") {
		const s = form.dd.lon.trim().replace(/,/g, ".");
		if (!s) return null;
		const n = parseFloat(s);
		return isNaN(n) ? null : n;
	}
	const degStr = form.dms.lon.deg.trim();
	if (!degStr) return null;
	const deg = parseFloat(degStr.replace(/,/g, "."));
	if (isNaN(deg)) return null;
	const min = parseFloat(form.dms.lon.min.trim().replace(/,/g, ".")) || 0;
	const sec = parseFloat(form.dms.lon.sec.trim().replace(/,/g, ".")) || 0;
	return dmsToDd(deg, min, sec);
});

const hasInput = computed(() => {
	if (mode.value === "dd") return form.dd.lat.trim() !== "" || form.dd.lon.trim() !== "";
	const { lat, lon } = form.dms;
	return !!(lat.deg.trim() || lat.min.trim() || lat.sec.trim() || lon.deg.trim() || lon.min.trim() || lon.sec.trim());
});

const isValid = computed(() => latDD.value !== null && lonDD.value !== null);

const xyRaw = computed(() => {
	if (!isValid.value) return null;
	return ATPOL.latlon_to_xy({ lat: latDD.value, lon: lonDD.value });
});

const xy = computed(() => {
	if (!xyRaw.value) return null;
	const { x, y } = xyRaw.value;
	return x >= 0 && x <= 700 && y >= 0 && y <= 700 ? xyRaw.value : null;
});

const isOutOfBounds = computed(() => isValid.value && xyRaw.value !== null && xy.value === null);

const gridFull = computed(() => {
	if (!xy.value) return null;
	try { return ATPOL.xy_to_grid(xy.value, 10).grid; } catch { return null; }
});

const gridFullDisplay = computed(() => {
	if (!gridFull.value) return "";
	try { return ATPOL.grid_normalize(gridFull.value, " "); } catch { return gridFull.value; }
});

const gridSelected = computed(() => {
	if (!xy.value) return null;
	try { return computeGridCode(xy.value, form.gridSize); } catch { return null; }
});

const gridSelectedNormalized = computed(() => {
	if (!gridSelected.value) return "";
	try { return ATPOL.grid_normalize(gridSelected.value); } catch { return gridSelected.value; }
});

const gridSelectedDisplay = computed(() => {
	if (!gridSelected.value) return "";
	try { return ATPOL.grid_normalize(gridSelected.value, " "); } catch { return gridSelected.value; }
});

const sideLabel = computed(() => {
	if (!gridSelected.value) return "";
	try { return formatSideLabel(gridSelected.value); } catch { return ""; }
});

const bounds = computed(() => {
	if (!gridSelected.value) return null;
	try { return ATPOL.grid_to_latlon_bounds(gridSelected.value); } catch { return null; }
});

const wktPolygon = computed(() => {
	if (!gridSelected.value) return "";
	try { return ATPOL.grid_to_polygonWKT(gridSelected.value); } catch { return ""; }
});

const wktCentroid = computed(() => {
	if (!gridSelected.value) return "";
	try { return ATPOL.grid_to_centroidWKT(gridSelected.value); } catch { return ""; }
});

const mapsUrl = computed(() => {
	if (latDD.value === null || lonDD.value === null) return "";
	return `https://maps.google.com/?q=${latDD.value.toFixed(6)},${lonDD.value.toFixed(6)}`;
});

const osmUrl = computed(() => {
	if (latDD.value === null || lonDD.value === null || !gridSelected.value) return "";
	const km = ATPOL.grid_to_square_side_in_km(gridSelected.value);
	const zoom = Math.min(18, Math.max(6, 14 - Math.round(Math.log2(Math.max(km, 0.001)))));
	return `https://www.openstreetmap.org/?mlat=${latDD.value.toFixed(6)}&mlon=${lonDD.value.toFixed(6)}&zoom=${zoom}`;
});

// ---- File preview ----

const previewOpen = ref(false);
const previewFilename = ref("");
const previewContent = ref("");
const previewType = ref("");

function inputPoint() {
	return latDD.value !== null && lonDD.value !== null
		? { lat: latDD.value, lon: lonDD.value }
		: undefined;
}

function openKMLPreview() {
	if (!bounds.value || !gridSelectedNormalized.value) return;
	previewContent.value = generateKMLString(gridSelectedNormalized.value, bounds.value, sideLabel.value, inputPoint());
	previewFilename.value = `ATPOL_${gridSelectedNormalized.value}.kml`;
	previewType.value = "kml";
	previewOpen.value = true;
}

function openGeoJSONPreview() {
	if (!bounds.value || !gridSelectedNormalized.value) return;
	previewContent.value = generateGeoJSONString(gridSelectedNormalized.value, bounds.value, sideLabel.value, inputPoint());
	previewFilename.value = `ATPOL_${gridSelectedNormalized.value}.geojson`;
	previewType.value = "geojson";
	previewOpen.value = true;
}

function downloadFromPreview() {
	if (!bounds.value || !gridSelectedNormalized.value) return;
	if (previewType.value === "kml") {
		downloadKML(gridSelectedNormalized.value, bounds.value, sideLabel.value, inputPoint());
	} else {
		downloadGeoJSON(gridSelectedNormalized.value, bounds.value, sideLabel.value, inputPoint());
	}
}
</script>

<template>
	<div class="max-w-2xl">
		<div class="mb-6">
			<div class="flex items-center gap-2 mb-1">
				<UIcon name="i-lucide-map-pin" class="text-primary size-6 shrink-0" />
				<h1 class="text-2xl font-bold">
					Kalkulator – współrzędne na kod kwadratu ATPOL
				</h1>
			</div>
			<p class="text-muted">
				Znajdź kod kwadratu ATPOL na podstawie współrzędnych geograficznych.
			</p>
		</div>

		<UCard class="mb-4">
			<div class="flex flex-col gap-4">
				<!-- GPS button -->
				<div>
					<UButton
						icon="i-lucide-crosshair"
						label="Pobierz moją lokalizację (GPS)"
						color="primary"
						variant="soft"
						:loading="gpsStatus.state === 'loading'"
						@click="getLocation"
					/>
					<p
						v-if="gpsStatus.state !== 'idle'"
						class="text-sm mt-1.5"
						:class="{
							'text-success': gpsStatus.state === 'success',
							'text-error': gpsStatus.state === 'error',
							'text-warning': gpsStatus.state === 'loading',
						}"
					>
						<template v-if="gpsStatus.state === 'success'">
							Pobrano lokalizację. Dokładność: <strong>{{ gpsStatus.accuracy }} m</strong>
						</template>
						<template v-else>{{ gpsStatus.text }}</template>
					</p>
				</div>

				<USeparator label="lub wpisz ręcznie" />

				<!-- Mode toggle -->
				<div class="flex gap-2">
					<UButton
						label="Stopnie dziesiętne (DD)"
						size="sm"
						:color="mode === 'dd' ? 'primary' : 'neutral'"
						:variant="mode === 'dd' ? 'solid' : 'outline'"
						@click="mode = 'dd'"
					/>
					<UButton
						label="Stopnie, minuty, sekundy (DMS)"
						size="sm"
						:color="mode === 'dms' ? 'primary' : 'neutral'"
						:variant="mode === 'dms' ? 'solid' : 'outline'"
						@click="mode = 'dms'"
					/>
				</div>

				<!-- DD inputs -->
				<div v-if="mode === 'dd'" class="grid sm:grid-cols-2 gap-4">
					<UFormField label="Szerokość geograficzna (φ)" hint="np. 52.2500">
						<UInput v-model="form.dd.lat" placeholder="52.2500" class="w-full font-mono">
							<template v-if="form.dd.lat" #trailing>
								<UTooltip text="Wyczyść" :delay-duration="0">
									<UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" aria-label="Wyczyść" @click="form.dd.lat = ''" />
								</UTooltip>
							</template>
						</UInput>
					</UFormField>
					<UFormField label="Długość geograficzna (λ)" hint="np. 21.0000">
						<UInput v-model="form.dd.lon" placeholder="21.0000" class="w-full font-mono">
							<template v-if="form.dd.lon" #trailing>
								<UTooltip text="Wyczyść" :delay-duration="0">
									<UButton icon="i-lucide-x" size="xs" color="neutral" variant="ghost" aria-label="Wyczyść" @click="form.dd.lon = ''" />
								</UTooltip>
							</template>
						</UInput>
					</UFormField>
				</div>

				<!-- DMS inputs -->
				<div v-else class="flex flex-col gap-4">
					<div>
						<p class="text-sm font-medium mb-2">
							Szerokość geograficzna (φ)
						</p>
						<div class="grid grid-cols-3 gap-2">
							<UFormField label="Stopnie (°)">
								<UInput v-model="form.dms.lat.deg" placeholder="52" class="w-full font-mono" />
							</UFormField>
							<UFormField label="Minuty (')">
								<UInput v-model="form.dms.lat.min" placeholder="15" class="w-full font-mono" />
							</UFormField>
							<UFormField label='Sekundy (")'>
								<UInput v-model="form.dms.lat.sec" placeholder="0.0" class="w-full font-mono" />
							</UFormField>
						</div>
					</div>
					<div>
						<p class="text-sm font-medium mb-2">
							Długość geograficzna (λ)
						</p>
						<div class="grid grid-cols-3 gap-2">
							<UFormField label="Stopnie (°)">
								<UInput v-model="form.dms.lon.deg" placeholder="21" class="w-full font-mono" />
							</UFormField>
							<UFormField label="Minuty (')">
								<UInput v-model="form.dms.lon.min" placeholder="0" class="w-full font-mono" />
							</UFormField>
							<UFormField label='Sekundy (")'>
								<UInput v-model="form.dms.lon.sec" placeholder="0.0" class="w-full font-mono" />
							</UFormField>
						</div>
					</div>
				</div>

				<!-- Grid size -->
				<UFormField label="Wielkość siatki">
					<USelect
						v-model="form.gridSize"
						:items="gridSizes"
						class="w-full sm:w-72"
					/>
				</UFormField>
			</div>
		</UCard>

		<!-- Empty state -->
		<UCard v-if="!hasInput" variant="subtle">
			<div class="text-center py-10 text-muted">
				<UIcon name="i-lucide-map" class="size-12 mx-auto mb-3 opacity-25" />
				<p class="font-medium">
					Tutaj pojawią się wyniki
				</p>
				<p class="text-sm">
					Wprowadź współrzędne powyżej.
				</p>
			</div>
		</UCard>

		<!-- Invalid coords -->
		<UAlert
			v-else-if="!isValid"
			icon="i-lucide-triangle-alert"
			color="error"
			variant="soft"
			title="Nieprawidłowe współrzędne"
			description="Sprawdź format wprowadzonych danych i spróbuj ponownie."
		/>

		<!-- Out of ATPOL bounds -->
		<UAlert
			v-else-if="isOutOfBounds"
			icon="i-lucide-circle-x"
			color="warning"
			variant="soft"
			title="Współrzędne poza siatką ATPOL"
			description="Podane współrzędne nie mieszczą się w obszarze siatki ATPOL (Polska i okolice)."
		/>

		<!-- Results -->
		<template v-else-if="xy && gridSelected && bounds">
			<!-- XY coords + full address -->
			<UCard class="mb-4">
				<div class="flex flex-col gap-3">
					<div class="grid sm:grid-cols-2 gap-3">
						<div class="p-3 bg-elevated rounded-lg text-sm">
							<span class="text-muted text-xs">Współrzędna X:</span>
							<div class="font-mono font-bold text-primary text-base mt-0.5">{{ xy.x.toFixed(3) }} m</div>
						</div>
						<div class="p-3 bg-elevated rounded-lg text-sm">
							<span class="text-muted text-xs">Współrzędna Y:</span>
							<div class="font-mono font-bold text-primary text-base mt-0.5">{{ xy.y.toFixed(3) }} m</div>
						</div>
					</div>
					<div class="p-3 bg-elevated rounded-lg text-sm text-center">
						<span class="text-muted text-xs uppercase tracking-wide">Pełny adres standardowy (do 10 m):</span>
						<div class="font-mono font-bold text-lg mt-1">{{ gridFullDisplay }}</div>
					</div>
				</div>
			</UCard>

			<!-- Selected grid code (prominent) -->
			<div class="mb-3 px-3 py-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
				<div class="text-xs text-muted uppercase tracking-wide mb-1">Kod wybranego kwadratu</div>
				<div class="font-mono font-extrabold text-2xl text-primary">{{ gridSelectedDisplay }}</div>
				<div class="text-sm text-muted mt-1">{{ sideLabel }}</div>
			</div>

			<!-- Map -->
			<AtpolMap
				:bounds="bounds"
				:marker="latDD !== null && lonDD !== null ? { lat: latDD, lon: lonDD } : null"
				class="mb-4"
			/>

			<!-- Map links -->
			<div class="flex gap-3 mb-3">
				<UButton
					:to="mapsUrl"
					target="_blank"
					icon="i-simple-icons-googlemaps"
					label="Mapy Google"
					color="error"
					class="flex-1"
					size="lg"
					external
				/>
				<UButton
					:to="osmUrl"
					target="_blank"
					icon="i-simple-icons-openstreetmap"
					label="OpenStreetMap"
					color="success"
					class="flex-1"
					size="lg"
					external
				/>
			</div>

			<!-- Downloads -->
			<div class="flex gap-3 mb-4">
				<UButton
					icon="i-lucide-eye"
					label="KML"
					color="primary"
					class="flex-1"
					size="lg"
					@click="openKMLPreview"
				/>
				<UButton
					icon="i-lucide-eye"
					label="GeoJSON"
					color="primary"
					variant="outline"
					class="flex-1"
					size="lg"
					@click="openGeoJSONPreview"
				/>
				<UButton
					icon="i-lucide-archive"
					label="SHP (ZIP)"
					color="neutral"
					class="flex-1"
					size="lg"
					@click="downloadSHPZip(gridSelectedNormalized, bounds)"
				/>
			</div>

			<!-- Darwin Core WKT -->
			<DarwinCoreFields :wkt-polygon="wktPolygon" :wkt-centroid="wktCentroid" />
		</template>

		<!-- File preview modal -->
		<FilePreviewModal
			v-model:open="previewOpen"
			:filename="previewFilename"
			:content="previewContent"
			:language="previewType === 'kml' ? 'xml' : 'json'"
			@download="downloadFromPreview"
		/>
	</div>
</template>
