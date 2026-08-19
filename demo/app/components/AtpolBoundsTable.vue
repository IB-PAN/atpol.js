<script setup lang="ts">
import { ATPOL } from "../../../main";

const props = defineProps<{
	bounds: ATPOL.Bounds_LatLon | null;
	atpolCode: string;
}>();

// Lets a sibling AtpolMap highlight the point belonging to the hovered row,
// and — while the coverage tab is open — draw the four rounded bounding-box
// coordinates as lines across the map.
const emit = defineEmits<{
	geoBoundsHover: [payload: { point: ATPOL.LatLon; label: string } | null];
	geoCoverageHover: [payload: { south: number; north: number; west: number; east: number; highlighted: string[] } | null];
}>();

function toDMS(decimal: number, isLat: boolean): string {
	const abs = Math.abs(decimal);
	const deg = Math.floor(abs);
	const minFull = (abs - deg) * 60;
	const min = Math.floor(minFull);
	const sec = ((minFull - min) * 60).toFixed(2).padStart(5, "0");
	const dir = isLat ? (decimal >= 0 ? "N" : "S") : (decimal >= 0 ? "E" : "W");
	return `${deg}° ${min}' ${sec}" ${dir}`;
}

const rows = computed(() => {
	if (!props.bounds) return [];
	return [
		{ icon: "i-lucide-square-dot", label: "ŚRODEK (Centrum)", short: "⊡ ŚRODEK", point: props.bounds.center, isCenter: true },
		{ icon: "i-lucide-move-up-left", label: "NW (Górny Lewy)", short: "↖ NW", point: props.bounds.nw },
		{ icon: "i-lucide-move-up-right", label: "NE (Górny Prawy)", short: "NE ↗", point: props.bounds.ne },
		{ icon: "i-lucide-move-down-left", label: "SE (Dolny Prawy)", short: "SE ↘", point: props.bounds.se },
		{ icon: "i-lucide-move-down-right", label: "SW (Dolny Lewy)", short: "↙ SW", point: props.bounds.sw },
	];
});

type Row = (typeof rows.value)[number];

const hoveredLabel = ref<string | null>(null);

function setHovered(row: Row | null) {
	hoveredLabel.value = row?.label ?? null;
	emit("geoBoundsHover", row ? { point: row.point, label: row.short } : null);
}

// The bounds can change while a row is hovered (e.g. the user edits the grid
// code with the pointer resting on the table), which would leave the map
// highlighting a stale point.
watch(() => props.bounds, () => setHovered(null));

onUnmounted(() => {
	if (hoveredLabel.value) emit("geoBoundsHover", null);
});

function rowClass(row: Row) {
	const hovered = hoveredLabel.value === row.label;
	if (row.isCenter) return hovered ? "bg-success/25" : "bg-success/10";
	return hovered ? "bg-primary/10" : "";
}

// ---- Tabs ----

const tabItems = [
	{ value: "bounds", slot: "bounds" as const, label: "Punkty brzegowe", icon: "i-lucide-frame" },
	{ value: "coverage", slot: "coverage" as const, label: "Rozpiętość geograficzna", icon: "i-lucide-expand" },
];

const activeTab = ref("bounds");

// Switching away unmounts the hovered row without firing mouseleave, which
// would leave the map highlighting a point the user can no longer see.
watch(activeTab, () => setHovered(null));

// ---- Geographic coverage ----

const geoCoverageDecimals = ref(3);

// Rounds away from the square (down for S/W, up for N/E) so that the rounded
// range always still contains the whole square, whatever the precision.
function roundOutward(value: number, up: boolean, digits: number): number {
	const factor = 10 ** digits;
	return (up ? Math.ceil(value * factor) : Math.floor(value * factor)) / factor;
}

const geoCoverageRows = computed(() => {
	const b = props.bounds;
	if (!b) return [];
	const lats = [b.nw.lat, b.ne.lat, b.se.lat, b.sw.lat];
	const lons = [b.nw.lon, b.ne.lon, b.se.lon, b.sw.lon];

	// `max` marks the upper end of the range: it both picks the rounding
	// direction and puts the direction icon after the label instead of before.
	function cell(key: string, label: string, hint: string, icon: string, value: number, max: boolean) {
		const rounded = roundOutward(value, max, geoCoverageDecimals.value);
		return { key, label, hint, icon, max, value: rounded, dec: rounded.toFixed(geoCoverageDecimals.value) };
	}

	return [
		{
			key: "lat",
			icon: "i-lucide-move-vertical",
			label: "Szerokość geograficzna",
			hint: "(od dołu do góry)",
			cells: [
				cell("south", "South", "(południe)", "i-lucide-move-down", Math.min(...lats), false),
				cell("north", "North", "(północ)", "i-lucide-move-up", Math.max(...lats), true),
			],
		},
		{
			key: "lon",
			icon: "i-lucide-move-horizontal",
			label: "Długość geograficzna",
			hint: "(od lewej do prawej)",
			cells: [
				cell("west", "West", "(zachód)", "i-lucide-move-left", Math.min(...lons), false),
				cell("east", "East", "(wschód)", "i-lucide-move-right", Math.max(...lons), true),
			],
		},
	];
});

// Either a single cell key ("south"/"north"/"west"/"east") or a row key
// ("lat"/"lon"), which stands for both of that row's cells.
const geoCoverageHovered = ref<string | null>(null);

const geoCoverageHighlighted = computed(() => {
	const hovered = geoCoverageHovered.value;
	if (!hovered) return [];
	const row = geoCoverageRows.value.find(r => r.key === hovered);
	// Hovering a row's label cell counts as hovering both of its value cells.
	return row ? [row.key, ...row.cells.map(c => c.key)] : [hovered];
});

function geoCoverageCellClass(key: string) {
	return geoCoverageHighlighted.value.includes(key) ? "bg-primary/10" : "";
}

// Lets the map draw the same four rounded values as lines. Only while the tab
// is open — the lines belong to what this tab is showing.
const geoCoveragePayload = computed(() => {
	if (activeTab.value !== "coverage") return null;
	const values: Record<string, number> = {};
	for (const row of geoCoverageRows.value) {
		for (const col of row.cells) values[col.key] = col.value;
	}
	const { south, north, west, east } = values;
	if (south === undefined || north === undefined || west === undefined || east === undefined) return null;
	return { south, north, west, east, highlighted: geoCoverageHighlighted.value.filter(key => key in values) };
});

watch(geoCoveragePayload, payload => emit("geoCoverageHover", payload), { immediate: true });

// Switching away unmounts the hovered cell without firing mouseleave.
watch(activeTab, () => {
	geoCoverageHovered.value = null;
});

onUnmounted(() => {
	if (geoCoveragePayload.value) emit("geoCoverageHover", null);
});

// Polish needs three plural forms for "miejsce po przecinku".
const geoCoverageDecimalsLabel = computed(() => {
	const n = geoCoverageDecimals.value;
	if (n === 1) return "1 miejsce po przecinku";
	const last = n % 10;
	const lastTwo = n % 100;
	const few = last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14);
	return `${n} ${few ? "miejsca" : "miejsc"} po przecinku`;
});

const geoCoverageDescription = computed(() => {
	try {
		const wp = ATPOL.WP.grid_is_valid(props.atpolCode);
		const api = wp ? ATPOL.WP : ATPOL;
		const m = api.grid_to_square_side_in_meters(props.atpolCode);
		const sizeStr = m >= 1000 ? `${m / 1000}×${m / 1000} km` : `${m}×${m} m`;
		const normalized = api.grid_normalize(props.atpolCode);
		const variant = wp ? ", Wojciech Paul division variant" : "";
		const ref = `https://botany.edu.pl/atpol-grid-code/${wp ? "WP:" : ""}${normalized}`;
		return `ATPOL (Polish geobotanical grid)${variant}, cell code: ${normalized} (${sizeStr}), reference: ${ref}`;
	} catch {
		return "";
	}
});

const copiedFields = reactive(new Set<string>());
async function copyText(key: string, text: string) {
	await navigator.clipboard.writeText(text);
	copiedFields.add(key);
	setTimeout(() => copiedFields.delete(key), 2000);
}
</script>

<template>
	<UCard v-if="rows.length">
		<UTabs
			v-model="activeTab"
			:items="tabItems"
			size="sm"
			class="w-full"
			:ui="{ content: 'mt-3' }"
		>
			<!-- Tab 1: bounding points -->
			<template #bounds>
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
								:class="['border-b border-default last:border-0 transition-colors cursor-default', rowClass(row)]"
								@mouseenter="setHovered(row)"
								@mouseleave="setHovered(null)"
								@focusin="setHovered(row)"
								@focusout="setHovered(null)"
							>
								<td class="py-2 px-3 font-medium whitespace-nowrap">
									<div class="flex items-center gap-1.5">
										<UIcon
											:name="row.icon"
											class="size-4"
										/>
										{{ row.label }}
									</div>
								</td>
								<td class="py-2 px-3 text-center">
									<div class="group/dec flex items-center justify-center gap-1">
										<span class="font-mono font-bold text-primary">{{ row.point.lat.toFixed(6) }}</span>
										<UButton
											:icon="copiedFields.has(`geoCoverage-${row.label}-lat-dec`) ? 'i-lucide-check' : 'i-lucide-copy'"
											:color="copiedFields.has(`geoCoverage-${row.label}-lat-dec`) ? 'primary' : 'neutral'"
											size="xs"
											variant="ghost"
											class="opacity-0 group-hover/dec:opacity-100 transition-opacity"
											:aria-label="`Kopiuj ${row.point.lat.toFixed(6)}`"
											@click="copyText(`geoCoverage-${row.label}-lat-dec`, row.point.lat.toFixed(6))"
										/>
									</div>
									<div class="group/dms flex items-center justify-center gap-1 mt-0.5">
										<span class="text-xs text-muted">{{ toDMS(row.point.lat, true) }}</span>
										<UButton
											:icon="copiedFields.has(`geoCoverage-${row.label}-lat-dms`) ? 'i-lucide-check' : 'i-lucide-copy'"
											:color="copiedFields.has(`geoCoverage-${row.label}-lat-dms`) ? 'primary' : 'neutral'"
											size="xs"
											variant="ghost"
											class="opacity-0 group-hover/dms:opacity-100 transition-opacity"
											:aria-label="`Kopiuj ${toDMS(row.point.lat, true)}`"
											@click="copyText(`geoCoverage-${row.label}-lat-dms`, toDMS(row.point.lat, true))"
										/>
									</div>
								</td>
								<td class="py-2 px-3 text-center">
									<div class="group/dec flex items-center justify-center gap-1">
										<span class="font-mono font-bold text-primary">{{ row.point.lon.toFixed(6) }}</span>
										<UButton
											:icon="copiedFields.has(`geoCoverage-${row.label}-lon-dec`) ? 'i-lucide-check' : 'i-lucide-copy'"
											:color="copiedFields.has(`geoCoverage-${row.label}-lon-dec`) ? 'primary' : 'neutral'"
											size="xs"
											variant="ghost"
											class="opacity-0 group-hover/dec:opacity-100 transition-opacity"
											:aria-label="`Kopiuj ${row.point.lon.toFixed(6)}`"
											@click="copyText(`geoCoverage-${row.label}-lon-dec`, row.point.lon.toFixed(6))"
										/>
									</div>
									<div class="group/dms flex items-center justify-center gap-1 mt-0.5">
										<span class="text-xs text-muted">{{ toDMS(row.point.lon, false) }}</span>
										<UButton
											:icon="copiedFields.has(`geoCoverage-${row.label}-lon-dms`) ? 'i-lucide-check' : 'i-lucide-copy'"
											:color="copiedFields.has(`geoCoverage-${row.label}-lon-dms`) ? 'primary' : 'neutral'"
											size="xs"
											variant="ghost"
											class="opacity-0 group-hover/dms:opacity-100 transition-opacity"
											:aria-label="`Kopiuj ${toDMS(row.point.lon, false)}`"
											@click="copyText(`geoCoverage-${row.label}-lon-dms`, toDMS(row.point.lon, false))"
										/>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</template>

			<!-- Tab 2: geographic coverage (bounding box) -->
			<template #coverage>
				<UAlert
					icon="i-lucide-triangle-alert"
					color="warning"
					variant="outline"
					class="mb-4"
				>
					<template #description>
						<p>
							Uwaga! Wartości powyżej określają rozpiętość geograficzną skrajnych współrzędnych kwadratu,
							jednak w przeciwieństwie do tabeli punktów brzegowych, nie określają one poprawnie
							kształtu kwadratu na mapie. Właściwy kwadrat jedynie zawiera się w podanym zakresie
							współrzędnych.
						</p>
						<p class="mt-2">
							Podane wartości mogą być użyteczne np. do wypełnienia strony „Geographic Coverage”
							w metadanych zbioru danych w systemie GBIF IPT.
						</p>
					</template>
				</UAlert>

				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<tbody>
							<tr
								v-for="row in geoCoverageRows"
								:key="row.key"
								class="border-b border-default last:border-0"
							>
								<td
									:class="['py-2 px-3 font-medium transition-colors cursor-default', geoCoverageCellClass(row.key)]"
									@mouseenter="geoCoverageHovered = row.key"
									@mouseleave="geoCoverageHovered = null"
									@focusin="geoCoverageHovered = row.key"
									@focusout="geoCoverageHovered = null"
								>
									<div class="flex items-center gap-1.5 whitespace-nowrap">
										<UIcon
											:name="row.icon"
											class="size-4"
										/>
										{{ row.label }}
									</div>
									<div class="text-xs text-muted whitespace-nowrap">
										{{ row.hint }}
									</div>
								</td>
								<td
									v-for="col in row.cells"
									:key="col.key"
									:class="['py-2 px-3 text-center transition-colors cursor-default', geoCoverageCellClass(col.key)]"
									@mouseenter="geoCoverageHovered = col.key"
									@mouseleave="geoCoverageHovered = null"
									@focusin="geoCoverageHovered = col.key"
									@focusout="geoCoverageHovered = null"
								>
									<div class="flex items-center justify-center gap-1 whitespace-nowrap font-medium">
										<UIcon
											v-if="!col.max"
											:name="col.icon"
											class="size-4"
										/>
										{{ col.label }}
										<UIcon
											v-if="col.max"
											:name="col.icon"
											class="size-4"
										/>
									</div>
									<div class="text-xs text-muted whitespace-nowrap">
										{{ col.hint }}
									</div>
									<div class="flex justify-center mt-0.5">
										<!-- The copy button sits outside the flow so the space it would reserve while hidden does not shift the value off-centre. -->
										<div class="group/dec relative">
											<span class="font-mono font-bold text-primary">{{ col.dec }}</span>
											<UButton
												:icon="copiedFields.has(`geoCoverage-${col.key}-dec`) ? 'i-lucide-check' : 'i-lucide-copy'"
												:color="copiedFields.has(`geoCoverage-${col.key}-dec`) ? 'primary' : 'neutral'"
												size="xs"
												variant="ghost"
												class="absolute left-full top-1/2 -translate-y-1/2 ml-0.5 opacity-0 group-hover/dec:opacity-100 transition-opacity"
												:aria-label="`Kopiuj ${col.dec}`"
												@click="copyText(`geoCoverage-${col.key}-dec`, col.dec)"
											/>
										</div>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				</div>

				<!-- Rounding -->
				<div class="flex items-center gap-3 mt-4">
					<span class="text-xs text-muted whitespace-nowrap">Zaokrąglenie: {{ geoCoverageDecimalsLabel }}</span>
					<UTooltip
						text="Wartości są zaokrąglane „na zewnątrz” (w dół dla południa i zachodu, w górę dla północy i wschodu), dzięki czemu kwadrat zawsze mieści się w podanym zakresie."
						:delay-duration="0"
					>
						<UIcon
							name="i-lucide-info"
							class="text-muted size-4 cursor-help shrink-0"
						/>
					</UTooltip>
					<USlider
						v-model="geoCoverageDecimals"
						:min="0"
						:max="6"
						:step="1"
						size="sm"
						class="flex-1 min-w-24"
						aria-label="Liczba miejsc po przecinku"
					/>
				</div>

				<!-- Description -->
				<div v-if="geoCoverageDescription">
					<hr class="border-muted my-4">
					<div class="flex items-center gap-2 mb-1">
						<span class="text-muted text-xs">Opis zasięgu geograficznego</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="flex-1 min-w-0 font-mono text-xs bg-elevated border border-default rounded-md px-3 py-2 text-foreground whitespace-pre-wrap break-words">
							{{ geoCoverageDescription }}
						</div>
						<div class="relative flex items-center">
							<Transition
								enter-active-class="transition-opacity duration-150"
								leave-active-class="transition-opacity duration-150"
								enter-from-class="opacity-0"
								leave-to-class="opacity-0"
							>
								<span
									v-if="copiedFields.has('geoCoverageDescription')"
									class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
								>Skopiowano!</span>
							</Transition>
							<UTooltip
								text="Kopiuj do schowka"
								:delay-duration="0"
							>
								<UButton
									:icon="copiedFields.has('geoCoverageDescription') ? 'i-lucide-check' : 'i-lucide-copy'"
									:color="copiedFields.has('geoCoverageDescription') ? 'success' : 'neutral'"
									size="sm"
									variant="ghost"
									aria-label="Kopiuj opis zasięgu geograficznego"
									@click="copyText('geoCoverageDescription', geoCoverageDescription)"
								/>
							</UTooltip>
						</div>
					</div>
				</div>
			</template>
		</UTabs>
	</UCard>
</template>
