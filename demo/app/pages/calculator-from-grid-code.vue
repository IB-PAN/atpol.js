<script setup lang="ts">
import { ATPOL } from "../../../main";
import { generateKMLString, generateGeoJSONString, downloadKML, downloadGeoJSON, downloadSHPZip } from "~/utils/atpol-export";

useSeoMeta({
	title: "Kalkulator – kod kwadratu ATPOL na współrzędne",
	description: "Znajdź współrzędne geograficzne centrum i wierzchołków kwadratu ATPOL.",
});

const code = ref("");

// A grid code is either a standard ATPOL code, or a Wojciech Paul (WP)
// variant (base code + "/" + division digits) - the WP prefix never appears
// in the `code` field itself, only in the URL hash.
const isWP = computed(() => code.value.trim() !== "" && ATPOL.WP.grid_is_valid(code.value));

function formatSideLabel(grid: string, wp: boolean) {
	const m = (wp ? ATPOL.WP : ATPOL).grid_to_square_side_in_meters(grid);
	const sizeStr = m >= 1000 ? `${m / 1000} × ${m / 1000} km` : `${m} × ${m} m`;
	if (wp) {
		const superscriptNumber = (number: number) => [...(number | 0).toString()].map(n => "⁰¹²³⁴⁵⁶⁷⁸⁹"[parseInt(n)]).join("");

		const base = grid.split("/")[0]!;
		const m_base = ATPOL.grid_to_square_side_in_meters(base);
		const sizeStr_base = m >= 1000 ? `${m_base / 1000} km` : `${m_base} m`;
		const division_multiplier = m_base / m;
		const power = Math.log(division_multiplier) / Math.log(2);
		const power_display = `2${superscriptNumber(power)}`;

		return `${sizeStr}\n(wariant podziału Wojciecha Paula – podział ${sizeStr_base} na ${power_display})`;
	} else {
		const div = ATPOL.grid_get_division_type(grid)?.toLowerCase();
		return div ? `${sizeStr} (typ ${div})` : sizeStr;
	}
}

const isValid = computed(() => code.value.trim() !== "" && (isWP.value || ATPOL.grid_is_valid(code.value)));

const codeNormalized = computed(() => {
	if (!isValid.value) return "";
	try {
		return (isWP.value ? ATPOL.WP : ATPOL).grid_normalize(code.value);
	} catch {
		return code.value.toUpperCase().replace(/\s/g, "");
	}
});

const result = computed(() => {
	if (!isValid.value) return null;
	try {
		const wp = isWP.value;
		const bounds = (wp ? ATPOL.WP : ATPOL).grid_to_latlon_bounds(code.value);
		const sideLabel = formatSideLabel(code.value, wp);
		const { center } = bounds;
		const km = (wp ? ATPOL.WP : ATPOL).grid_to_square_side_in_km(code.value);
		const zoom = Math.min(18, Math.max(6, 14 - Math.round(Math.log2(Math.max(km, 0.001)))));
		const mapsUrl = `https://maps.google.com/?q=${center.lat.toFixed(6)},${center.lon.toFixed(6)}`;
		const osmUrl = `https://www.openstreetmap.org/?mlat=${center.lat.toFixed(6)}&mlon=${center.lon.toFixed(6)}&zoom=${zoom}`;
		return { bounds, sideLabel, mapsUrl, osmUrl };
	} catch (err) {
		console.error(err);
		return null;
	}
});

// ---- URL hash sync ----
// WP codes are stored in the hash with a "WP:" prefix (e.g. "#WP:ED26/000")
// so they can be told apart from standard codes (e.g. "#EF25p44") on load.
// The prefix is never part of the `code` field itself.

function codeFromHash(): string {
	const raw = window.location.hash.slice(1);
	if (!raw) return "";
	let decoded = raw;
	try { decoded = decodeURIComponent(raw); } catch { /* keep raw if malformed */ }
	return decoded.toUpperCase().startsWith("WP:") ? decoded.slice(3) : decoded;
}

function applyHashToCode() {
	const fromHash = codeFromHash();
	if (fromHash !== code.value) code.value = fromHash;
}

function updateHashFromCode() {
	const trimmed = code.value.trim();
	const { pathname, search } = window.location;
	if (!trimmed) {
		history.replaceState(null, "", `${pathname}${search}`);
		return;
	}
	const prefix = ATPOL.WP.grid_is_valid(trimmed) ? "WP:" : "";
	history.replaceState(null, "", `${pathname}${search}#${prefix}${trimmed}`);
}

onMounted(() => {
	applyHashToCode();
	window.addEventListener("hashchange", applyHashToCode);
});

onBeforeUnmount(() => {
	window.removeEventListener("hashchange", applyHashToCode);
});

watch(code, updateHashFromCode);

// ---- File preview modal ----

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
				<UIcon
					name="i-lucide-compass"
					class="text-primary size-6 shrink-0"
				/>
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
						<template
							v-if="code"
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
							<UBadge
								label="Standardowe"
								size="xs"
								color="neutral"
								variant="subtle"
							/>
							<span>
								<code class="font-mono cursor-pointer hover:underline" @click="code = 'EF'">EF</code>,
								<code class="font-mono cursor-pointer hover:underline" @click="code = 'EF25'">EF25</code>,
								<code class="font-mono cursor-pointer hover:underline" @click="code = 'EF2533'">EF2533</code>, …
							</span>
						</div>
						<div class="flex items-center gap-2">
							<UBadge
								label="Niestandardowe"
								size="xs"
								color="primary"
								variant="subtle"
							/>
							<span>
								<code class="font-mono cursor-pointer hover:underline" @click="code = 'EF25d11'">EF25d11</code>,
								<code class="font-mono cursor-pointer hover:underline" @click="code = 'EF25c33'">EF25c33</code>,
								<code class="font-mono cursor-pointer hover:underline" @click="code = 'EF25p44'">EF25p44</code>, …
							</span>
						</div>
					</div>
				</div>
			</div>
		</UCard>

		<!-- Empty state -->
		<UCard
			v-if="!code.trim()"
			variant="subtle"
		>
			<div class="text-center py-10 text-muted">
				<UIcon
					name="i-lucide-crosshair"
					class="size-12 mx-auto mb-3 opacity-25"
				/>
				<p class="font-medium">
					Tutaj pojawią się wyniki
				</p>
				<p class="text-sm">
					Wpisz kod kwadratu powyżej.
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
			<div class="mb-3 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm font-semibold text-primary text-center whitespace-pre-wrap">
				Rozmiar kwadratu: {{ result.sideLabel }}
			</div>

			<AtpolBoundsTable
				:bounds="result.bounds"
				class="mb-4"
			/>

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

			<!-- Darwin Core WKT -->
			<DarwinCoreFields :atpol-code="codeNormalized" />
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
