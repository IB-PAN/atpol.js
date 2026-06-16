<script setup>
import * as ATPOL from "../../../main.ts";

useSeoMeta({
	title: "Kalkulator – kod kwadratu ATPOL na współrzędne",
	description: "Znajdź współrzędne geograficzne centrum i wierzchołków kwadratu ATPOL.",
});

const code = ref("");

function toDMS(decimal, isLat) {
	const abs = Math.abs(decimal);
	const deg = Math.floor(abs);
	const minFull = (abs - deg) * 60;
	const min = Math.floor(minFull);
	const sec = ((minFull - min) * 60).toFixed(2).padStart(5, "0");
	const dir = isLat ? (decimal >= 0 ? "N" : "S") : (decimal >= 0 ? "E" : "W");
	return `${deg}° ${min}' ${sec}" ${dir}`;
}

function formatSideLabel(grid) {
	const m = ATPOL.grid_to_square_side_in_meters(grid);
	const sizeStr = m >= 1000 ? `${m / 1000} x ${m / 1000} km` : `${m} x ${m} m`;
	const divMatch = grid.toUpperCase().replace(/\s/g, "").match(/([DCP])\d{2}$/);
	return divMatch ? `${sizeStr} (typ ${divMatch[1].toLowerCase()})` : sizeStr;
}

const isValid = computed(() => code.value.trim() !== "" && ATPOL.grid_is_valid(code.value));

const codeNormalized = computed(() => {
	if (!isValid.value) return "";
	try {
		return ATPOL.grid_normalize(code.value);
	} catch {
		return code.value.toUpperCase().replace(/\s/g, "");
	}
});

const result = computed(() => {
	if (!isValid.value) return null;
	try {
		const bounds = ATPOL.grid_to_latlon_bounds(code.value);
		const sideLabel = formatSideLabel(code.value);
		const { center } = bounds;
		const km = ATPOL.grid_to_square_side_in_km(code.value);
		const zoom = Math.min(18, Math.max(6, 14 - Math.round(Math.log2(Math.max(km, 0.001)))));
		const mapsUrl = `https://maps.google.com/?q=${center.lat.toFixed(6)},${center.lon.toFixed(6)}`;
		const osmUrl = `https://www.openstreetmap.org/?mlat=${center.lat.toFixed(6)}&mlon=${center.lon.toFixed(6)}&zoom=${zoom}`;
		return { bounds, sideLabel, mapsUrl, osmUrl };
	} catch {
		return null;
	}
});

const rows = computed(() => {
	if (!result.value) return [];
	const { bounds } = result.value;
	return [
		{ label: "ŚRODEK (Centrum)", point: bounds.center, isCenter: true },
		{ label: "NW (Górny Lewy)", point: bounds.nw },
		{ label: "NE (Górny Prawy)", point: bounds.ne },
		{ label: "SE (Dolny Prawy)", point: bounds.se },
		{ label: "SW (Dolny Lewy)", point: bounds.sw },
	];
});

const wktPolygon = computed(() => {
	if (!isValid.value) return "";
	try { return ATPOL.grid_to_polygonWKT(code.value); } catch { return ""; }
});

const wktCentroid = computed(() => {
	if (!isValid.value) return "";
	try { return ATPOL.grid_to_centroidWKT(code.value); } catch { return ""; }
});

const copiedFields = reactive(new Set());
async function copyText(key, text) {
	await navigator.clipboard.writeText(text);
	copiedFields.add(key);
	setTimeout(() => copiedFields.delete(key), 2000);
}

// ---- Preview modal ----

const previewOpen = ref(false);
const previewFilename = ref("");
const previewContent = ref("");
const previewType = ref("");

function openKMLPreview() {
	if (!result.value) return;
	previewContent.value = generateKMLString(codeNormalized.value, result.value.bounds, result.value.sideLabel);
	previewFilename.value = `ATPOL_${codeNormalized.value}.kml`;
	previewType.value = "kml";
	previewOpen.value = true;
}

function openGeoJSONPreview() {
	if (!result.value) return;
	previewContent.value = generateGeoJSONString(codeNormalized.value, result.value.bounds, result.value.sideLabel);
	previewFilename.value = `ATPOL_${codeNormalized.value}.geojson`;
	previewType.value = "geojson";
	previewOpen.value = true;
}

function downloadFromPreview() {
	if (!result.value) return;
	if (previewType.value === "kml") {
		downloadKML(codeNormalized.value, result.value.bounds, result.value.sideLabel);
	} else {
		downloadGeoJSON(codeNormalized.value, result.value.bounds, result.value.sideLabel);
	}
}
</script>

<template>
	<div class="max-w-2xl">
		<div class="mb-6">
			<div class="flex items-center gap-2 mb-1">
				<UIcon name="i-lucide-compass" class="text-primary size-6 shrink-0" />
				<h1 class="text-2xl font-bold">
					Kalkulator – kod kwadratu ATPOL na współrzędne
				</h1>
			</div>
			<p class="text-muted">
				Znajdź współrzędne geograficzne centrum i wierzchołków kwadratu ATPOL na podstawie jego kodu.
			</p>
		</div>

		<UCard class="mb-4">
			<div class="flex flex-col gap-4">
				<UFormField
					label="Kod kwadratu ATPOL"
					hint="Wyniki pojawiają się automatycznie podczas wpisywania"
				>
					<UInput
						v-model="code"
						placeholder="np. EF25"
						class="w-full sm:w-64 font-mono text-lg"
						autofocus
					>
						<template v-if="code" #trailing>
							<UTooltip text="Wyczyść" :delay-duration="0">
								<UButton
									icon="i-lucide-x"
									size="xs"
									color="neutral"
									variant="ghost"
									aria-label="Wyczyść kod"
									@click="code = ''"
								/>
							</UTooltip>
						</template>
					</UInput>
				</UFormField>

				<div class="p-3 bg-elevated rounded-lg text-sm">
					<p class="font-medium mb-2">
						Obsługiwane formaty:
					</p>
					<div class="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-muted">
						<div class="flex items-center gap-2">
							<UBadge label="Standardowe" size="xs" color="neutral" variant="subtle" />
							<span>
								<code class="font-mono">EF</code>,
								<code class="font-mono">EF25</code>,
								<code class="font-mono">EF2533</code>, …
							</span>
						</div>
						<div class="flex items-center gap-2">
							<UBadge label="Niestandardowe" size="xs" color="primary" variant="subtle" />
							<span>
								<code class="font-mono">EF25d11</code>,
								<code class="font-mono">EF25c33</code>,
								<code class="font-mono">EF25p44</code>, …
							</span>
						</div>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Empty state -->
		<UCard v-if="!code.trim()" variant="subtle">
			<div class="text-center py-10 text-muted">
				<UIcon name="i-lucide-crosshair" class="size-12 mx-auto mb-3 opacity-25" />
				<p class="font-medium">
					Tutaj pojawią się wyniki
				</p>
				<p class="text-sm">
					Wpisz kod kwadratu powyżej
				</p>
			</div>
		</UCard>

		<!-- Invalid code -->
		<UAlert
			v-else-if="!isValid"
			icon="i-lucide-triangle-alert"
			color="error"
			variant="soft"
			title="Nieprawidłowy kod ATPOL"
			description="Sprawdź format kodu i spróbuj ponownie."
		/>

		<!-- Results -->
		<template v-else-if="result">
			<div class="mb-3 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm font-semibold text-primary text-center">
				Rozmiar kwadratu: {{ result.sideLabel }}
			</div>

			<UCard class="mb-4">
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-default">
								<th class="text-left py-2 px-3 text-muted font-medium">
									Punkt
								</th>
								<th class="text-center py-2 px-3 text-muted font-medium">
									Szerokość (φ)
								</th>
								<th class="text-center py-2 px-3 text-muted font-medium">
									Długość (λ)
								</th>
							</tr>
						</thead>
						<tbody>
							<tr
								v-for="row in rows"
								:key="row.label"
								:class="['border-b border-default last:border-0', row.isCenter && 'bg-success/10']"
							>
								<td class="py-2 px-3 font-medium whitespace-nowrap">
									{{ row.label }}
								</td>
								<td class="py-2 px-3 text-center">
									<span class="font-mono font-bold text-primary block">{{ row.point.lat.toFixed(6) }}</span>
									<span class="text-xs text-muted block mt-0.5">{{ toDMS(row.point.lat, true) }}</span>
								</td>
								<td class="py-2 px-3 text-center">
									<span class="font-mono font-bold text-primary block">{{ row.point.lon.toFixed(6) }}</span>
									<span class="text-xs text-muted block mt-0.5">{{ toDMS(row.point.lon, false) }}</span>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</UCard>

			<AtpolMap
				:bounds="result.bounds"
				class="mb-4"
			/>

			<!-- Map links -->
			<div class="flex gap-3 mb-3">
				<UButton
					:to="result.mapsUrl"
					target="_blank"
					icon="i-simple-icons-googlemaps"
					label="Mapy Google"
					color="error"
					class="flex-1"
					size="lg"
					external
				/>
				<UButton
					:to="result.osmUrl"
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
					@click="downloadSHPZip(codeNormalized, result.bounds)"
				/>
			</div>

			<!-- DarwinCore WKT -->
			<UCard>
				<div class="flex items-center gap-2 mb-3">
					<UIcon name="i-lucide-map-pin" class="text-primary size-5 shrink-0" />
					<h2 class="font-semibold text-sm">
						Wartości DarwinCore (WKT)
					</h2>
					<UTooltip text="Wartości WKT (Well-Known Text) gotowe do użycia w danych DarwinCore (GBIF)" :delay-duration="0">
						<UIcon name="i-lucide-info" class="text-muted size-4 cursor-help" />
					</UTooltip>
				</div>

				<div class="flex flex-col gap-3 text-sm">
					<!-- footprintWKT -->
					<div>
						<div class="flex items-center gap-2 mb-1">
							<code class="text-xs bg-elevated px-1.5 py-0.5 rounded font-mono text-primary">footprintWKT</code>
							<span class="text-muted text-xs">Poligon (obrys kwadratu)</span>
						</div>
						<div class="flex items-center gap-2">
							<input
								:value="wktPolygon"
								readonly
								class="flex-1 min-w-0 font-mono text-xs bg-elevated border border-default rounded-md px-3 py-2 text-foreground outline-none overflow-x-hidden whitespace-nowrap text-ellipsis focus:overflow-x-auto"
							>
							<div class="relative flex items-center">
								<Transition
									enter-active-class="transition-opacity duration-150"
									leave-active-class="transition-opacity duration-150"
									enter-from-class="opacity-0"
									leave-to-class="opacity-0"
								>
									<span v-if="copiedFields.has('polygon')" class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10">Skopiowano!</span>
								</Transition>
								<UTooltip text="Kopiuj do schowka" :delay-duration="0">
									<UButton
										:icon="copiedFields.has('polygon') ? 'i-lucide-check' : 'i-lucide-copy'"
										:color="copiedFields.has('polygon') ? 'success' : 'neutral'"
										size="sm"
										variant="ghost"
										aria-label="Kopiuj footprintWKT"
										@click="copyText('polygon', wktPolygon)"
									/>
								</UTooltip>
							</div>
						</div>
					</div>

					<!-- footprintSRS -->
					<div>
						<div class="flex items-center gap-2 mb-1">
							<code class="text-xs bg-elevated px-1.5 py-0.5 rounded font-mono text-primary">footprintSRS</code>
							<span class="text-muted text-xs">Układ odniesienia</span>
							<UTooltip text="EPSG:4326 odpowiada układowi WGS84 — standardowemu układowi stosowanemu w GPS i większości danych geograficznych" :delay-duration="0">
								<UIcon name="i-lucide-info" class="text-muted size-4 cursor-help" />
							</UTooltip>
						</div>
						<div class="flex items-center gap-2">
							<input
								value="EPSG:4326"
								readonly
								class="flex-1 min-w-0 font-mono text-xs bg-elevated border border-default rounded-md px-3 py-2 text-foreground outline-none overflow-x-hidden whitespace-nowrap text-ellipsis focus:overflow-x-auto"
							>
							<div class="relative flex items-center">
								<Transition
									enter-active-class="transition-opacity duration-150"
									leave-active-class="transition-opacity duration-150"
									enter-from-class="opacity-0"
									leave-to-class="opacity-0"
								>
									<span v-if="copiedFields.has('srs')" class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10">Skopiowano!</span>
								</Transition>
								<UTooltip text="Kopiuj do schowka" :delay-duration="0">
									<UButton
										:icon="copiedFields.has('srs') ? 'i-lucide-check' : 'i-lucide-copy'"
										:color="copiedFields.has('srs') ? 'success' : 'neutral'"
										size="sm"
										variant="ghost"
										aria-label="Kopiuj footprintSRS"
										@click="copyText('srs', 'EPSG:4326')"
									/>
								</UTooltip>
							</div>
						</div>
					</div>

					<!-- centroid WKT (informational) -->
					<div>
						<div class="flex items-center gap-2 mb-1">
							<span class="text-muted text-xs">Centroid (punkt środkowy WKT)</span>
							<UTooltip text="Wartość pomocnicza — WKT punktu centralnego kwadratu. Nie jest standardowym polem DarwinCore, ale może być przydatna." :delay-duration="0">
								<UIcon name="i-lucide-info" class="text-muted size-4 cursor-help" />
							</UTooltip>
						</div>
						<div class="flex items-center gap-2">
							<input
								:value="wktCentroid"
								readonly
								class="flex-1 min-w-0 font-mono text-xs bg-elevated border border-default rounded-md px-3 py-2 text-foreground outline-none overflow-x-hidden whitespace-nowrap text-ellipsis focus:overflow-x-auto"
							>
							<div class="relative flex items-center">
								<Transition
									enter-active-class="transition-opacity duration-150"
									leave-active-class="transition-opacity duration-150"
									enter-from-class="opacity-0"
									leave-to-class="opacity-0"
								>
									<span v-if="copiedFields.has('centroid')" class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10">Skopiowano!</span>
								</Transition>
								<UTooltip text="Kopiuj do schowka" :delay-duration="0">
									<UButton
										:icon="copiedFields.has('centroid') ? 'i-lucide-check' : 'i-lucide-copy'"
										:color="copiedFields.has('centroid') ? 'success' : 'neutral'"
										size="sm"
										variant="ghost"
										aria-label="Kopiuj centroid WKT"
										@click="copyText('centroid', wktCentroid)"
									/>
								</UTooltip>
							</div>
						</div>
					</div>
				</div>
			</UCard>
		</template>

		<!-- File preview modal -->
		<UModal v-model:open="previewOpen" :title="previewFilename" :ui="{ content: 'max-w-5xl' }">
			<template #body>
				<div class="relative rounded overflow-hidden">
					<div class="absolute top-2 right-2 z-10 flex items-center gap-2">
						<Transition
							enter-active-class="transition-opacity duration-150"
							leave-active-class="transition-opacity duration-150"
							enter-from-class="opacity-0"
							leave-to-class="opacity-0"
						>
							<span
								v-if="copiedFields.has('preview')"
								class="text-xs font-medium text-success bg-success/15 border border-success/30 px-1.5 py-0.5 rounded"
							>Skopiowano!</span>
						</Transition>
						<UTooltip text="Kopiuj do schowka" :delay-duration="0">
							<UButton
								:icon="copiedFields.has('preview') ? 'i-lucide-check' : 'i-lucide-copy'"
								:color="copiedFields.has('preview') ? 'success' : 'neutral'"
								size="xs"
								variant="soft"
								aria-label="Kopiuj do schowka"
								@click="copyText('preview', previewContent)"
							/>
						</UTooltip>
					</div>
					<div class="overflow-auto max-h-[65vh]">
						<highlightjs
							:language="previewType === 'kml' ? 'xml' : 'json'"
							:code="previewContent"
						/>
					</div>
				</div>
			</template>
			<template #footer>
				<div class="flex justify-end gap-3">
					<UButton
						label="Zamknij"
						color="neutral"
						variant="ghost"
						@click="previewOpen = false"
					/>
					<UButton
						icon="i-lucide-download"
						label="Pobierz"
						@click="downloadFromPreview"
					/>
				</div>
			</template>
		</UModal>
	</div>
</template>
