<script setup lang="ts">
import { ATPOL } from "../../../main";
import { dmsToDd, parseDmsString } from "~/utils/coord-utils";
import { generateKMLString, generateGeoJSONString, downloadKML, downloadGeoJSON, downloadSHPZip } from "~/utils/atpol-export";
import { gridSizes, computeGridCode, formatSideLabel, type GridSizeKey } from "~/utils/grid-sizes";

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
	dms_str: { lat: "", lon: "" },
	gridSize: "10km" as GridSizeKey,
});

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
			const msgs: Record<number, string> = {
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
	if (mode.value === "dms") {
		const degStr = form.dms.lat.deg.trim();
		if (!degStr) return null;
		const deg = parseFloat(degStr.replace(/,/g, "."));
		if (isNaN(deg)) return null;
		const min = parseFloat(form.dms.lat.min.trim().replace(/,/g, ".")) || 0;
		const sec = parseFloat(form.dms.lat.sec.trim().replace(/,/g, ".")) || 0;
		return dmsToDd(deg, min, sec);
	}
	const s = form.dms_str.lat.trim();
	if (!s) return null;
	return parseDmsString(s);
});

const lonDD = computed(() => {
	if (mode.value === "dd") {
		const s = form.dd.lon.trim().replace(/,/g, ".");
		if (!s) return null;
		const n = parseFloat(s);
		return isNaN(n) ? null : n;
	}
	if (mode.value === "dms") {
		const degStr = form.dms.lon.deg.trim();
		if (!degStr) return null;
		const deg = parseFloat(degStr.replace(/,/g, "."));
		if (isNaN(deg)) return null;
		const min = parseFloat(form.dms.lon.min.trim().replace(/,/g, ".")) || 0;
		const sec = parseFloat(form.dms.lon.sec.trim().replace(/,/g, ".")) || 0;
		return dmsToDd(deg, min, sec);
	}
	const s = form.dms_str.lon.trim();
	if (!s) return null;
	return parseDmsString(s);
});

const hasInput = computed(() => {
	if (mode.value === "dd") return form.dd.lat.trim() !== "" || form.dd.lon.trim() !== "";
	if (mode.value === "dms") {
		const { lat, lon } = form.dms;
		return !!(lat.deg.trim() || lat.min.trim() || lat.sec.trim() || lon.deg.trim() || lon.min.trim() || lon.sec.trim());
	}
	return form.dms_str.lat.trim() !== "" || form.dms_str.lon.trim() !== "";
});

const isValid = computed(() => latDD.value !== null && lonDD.value !== null);

const xyRaw = computed(() => {
	if (!isValid.value) return null;
	return ATPOL.latlon_to_xy({ lat: latDD.value!, lon: lonDD.value! });
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
				<UIcon
					name="i-lucide-map-pin"
					class="text-primary size-6 shrink-0"
				/>
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
						<template v-else>
							{{ gpsStatus.text }}
						</template>
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
					<UButton
						label="Ciąg znaków (DMS)"
						size="sm"
						:color="mode === 'dms_str' ? 'primary' : 'neutral'"
						:variant="mode === 'dms_str' ? 'solid' : 'outline'"
						@click="mode = 'dms_str'"
					/>
				</div>

				<!-- DD inputs -->
				<div
					v-if="mode === 'dd'"
					class="grid sm:grid-cols-2 gap-4"
				>
					<UFormField
						label="Szerokość geograficzna (φ)"
						hint="np. 52.2500"
					>
						<UInput
							v-model="form.dd.lat"
							placeholder="52.2500"
							class="w-full font-mono"
						>
							<template
								v-if="form.dd.lat"
								#trailing
							>
								<UTooltip
									text="Wyczyść"
									:delay-duration="0"
								>
									<UButton
										icon="i-lucide-x"
										size="xs"
										color="neutral"
										variant="ghost"
										aria-label="Wyczyść"
										@click="form.dd.lat = ''"
									/>
								</UTooltip>
							</template>
						</UInput>
					</UFormField>
					<UFormField
						label="Długość geograficzna (λ)"
						hint="np. 21.0000"
					>
						<UInput
							v-model="form.dd.lon"
							placeholder="21.0000"
							class="w-full font-mono"
						>
							<template
								v-if="form.dd.lon"
								#trailing
							>
								<UTooltip
									text="Wyczyść"
									:delay-duration="0"
								>
									<UButton
										icon="i-lucide-x"
										size="xs"
										color="neutral"
										variant="ghost"
										aria-label="Wyczyść"
										@click="form.dd.lon = ''"
									/>
								</UTooltip>
							</template>
						</UInput>
					</UFormField>
				</div>

				<!-- DMS inputs -->
				<div
					v-else-if="mode === 'dms'"
					class="flex flex-col gap-4"
				>
					<div>
						<p class="text-sm font-medium mb-2">
							Szerokość geograficzna (φ)
						</p>
						<div class="grid grid-cols-3 gap-2">
							<UFormField label="Stopnie (°)">
								<UInput
									v-model="form.dms.lat.deg"
									placeholder="52"
									class="w-full font-mono"
								/>
							</UFormField>
							<UFormField label="Minuty (')">
								<UInput
									v-model="form.dms.lat.min"
									placeholder="15"
									class="w-full font-mono"
								/>
							</UFormField>
							<UFormField label="Sekundy (&quot;)">
								<UInput
									v-model="form.dms.lat.sec"
									placeholder="0.0"
									class="w-full font-mono"
								/>
							</UFormField>
						</div>
					</div>
					<div>
						<p class="text-sm font-medium mb-2">
							Długość geograficzna (λ)
						</p>
						<div class="grid grid-cols-3 gap-2">
							<UFormField label="Stopnie (°)">
								<UInput
									v-model="form.dms.lon.deg"
									placeholder="21"
									class="w-full font-mono"
								/>
							</UFormField>
							<UFormField label="Minuty (')">
								<UInput
									v-model="form.dms.lon.min"
									placeholder="0"
									class="w-full font-mono"
								/>
							</UFormField>
							<UFormField label="Sekundy (&quot;)">
								<UInput
									v-model="form.dms.lon.sec"
									placeholder="0.0"
									class="w-full font-mono"
								/>
							</UFormField>
						</div>
					</div>
				</div>

				<!-- String inputs -->
				<div
					v-else
					class="grid sm:grid-cols-2 gap-4"
				>
					<UFormField
						label="Szerokość geograficzna (φ)"
						hint="np. 52°15′0″"
					>
						<UInput
							v-model="form.dms_str.lat"
							placeholder="52°15′0″"
							class="w-full font-mono"
						>
							<template
								v-if="form.dms_str.lat"
								#trailing
							>
								<UTooltip
									text="Wyczyść"
									:delay-duration="0"
								>
									<UButton
										icon="i-lucide-x"
										size="xs"
										color="neutral"
										variant="ghost"
										aria-label="Wyczyść"
										@click="form.dms_str.lat = ''"
									/>
								</UTooltip>
							</template>
						</UInput>
					</UFormField>
					<UFormField
						label="Długość geograficzna (λ)"
						hint="np. 21°0′0″"
					>
						<UInput
							v-model="form.dms_str.lon"
							placeholder="21°0′0″"
							class="w-full font-mono"
						>
							<template
								v-if="form.dms_str.lon"
								#trailing
							>
								<UTooltip
									text="Wyczyść"
									:delay-duration="0"
								>
									<UButton
										icon="i-lucide-x"
										size="xs"
										color="neutral"
										variant="ghost"
										aria-label="Wyczyść"
										@click="form.dms_str.lon = ''"
									/>
								</UTooltip>
							</template>
						</UInput>
					</UFormField>
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
		<UCard
			v-if="!hasInput"
			variant="subtle"
		>
			<div class="text-center py-10 text-muted">
				<UIcon
					name="i-lucide-map"
					class="size-12 mx-auto mb-3 opacity-25"
				/>
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
			<UCollapsible class="mb-4">
				<UButton
					variant="ghost"
					color="neutral"
					size="sm"
					leading-icon="i-lucide-chevron-right"
					class="w-full justify-start text-muted text-xs group"
					:ui="{ leadingIcon: 'group-data-[state=open]:rotate-90 transition-transform' }"
				>
					Szczegóły kodu (współrzędne XY, pełny adres)
				</UButton>
				<template #content>
					<div class="px-px pb-px">
						<UCard class="mt-2">
							<div class="flex flex-col gap-3">
								<div class="grid sm:grid-cols-2 gap-3">
									<div class="p-3 bg-elevated rounded-lg text-sm">
										<span class="text-muted text-xs">Współrzędna X:</span>
										<div class="font-mono font-bold text-primary text-base mt-0.5">
											{{ xy.x.toFixed(3) }} m
										</div>
									</div>
									<div class="p-3 bg-elevated rounded-lg text-sm">
										<span class="text-muted text-xs">Współrzędna Y:</span>
										<div class="font-mono font-bold text-primary text-base mt-0.5">
											{{ xy.y.toFixed(3) }} m
										</div>
									</div>
								</div>
								<div class="p-3 bg-elevated rounded-lg text-sm text-center">
									<span class="text-muted text-xs uppercase tracking-wide">Pełny adres standardowy (do 10 m):</span>
									<GridCodeDisplay
										:code="gridFull ?? ''"
										:display="gridFullDisplay"
										text-class="font-bold text-lg mt-1"
									/>
								</div>
							</div>
						</UCard>
					</div>
				</template>
			</UCollapsible>

			<!-- Selected grid code (prominent) -->
			<div class="mb-3 px-3 py-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
				<div class="text-xs text-muted uppercase tracking-wide mb-1">
					Kod wybranego kwadratu
				</div>
				<GridCodeDisplay
					:code="gridSelectedNormalized"
					:display="gridSelectedDisplay"
					text-class="font-extrabold text-2xl text-primary"
				/>
				<div class="text-sm text-muted mt-1">
					{{ sideLabel }}
				</div>
			</div>

			<!-- Bounds table -->
			<UCollapsible class="mb-4">
				<UButton
					variant="ghost"
					color="neutral"
					size="sm"
					leading-icon="i-lucide-chevron-right"
					class="w-full justify-start text-muted text-xs group"
					:ui="{ leadingIcon: 'group-data-[state=open]:rotate-90 transition-transform' }"
				>
					Zasięg kwadratu (współrzędne punktów granicznych)
				</UButton>
				<template #content>
					<div class="px-px pb-px">
						<AtpolBoundsTable
							:bounds="bounds"
							class="mt-2"
						/>
					</div>
				</template>
			</UCollapsible>

			<!-- Map -->
			<AtpolMap
				:bounds="bounds"
				:marker="latDD !== null && lonDD !== null ? { lat: latDD, lon: lonDD } : null"
				class="mb-4"
			/>

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
			<DarwinCoreFields :atpol-code="gridSelectedNormalized" />
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
