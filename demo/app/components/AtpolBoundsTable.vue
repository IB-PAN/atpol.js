<script setup lang="ts">
import type { ATPOL } from "../../../main";

const props = defineProps<{
	bounds: ATPOL.Bounds_LatLon | null;
}>();

// Lets a sibling AtpolMap highlight the point belonging to the hovered row.
const emit = defineEmits<{
	hover: [payload: { point: ATPOL.LatLon; label: string } | null];
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
	emit("hover", row ? { point: row.point, label: row.short } : null);
}

// The bounds can change while a row is hovered (e.g. the user edits the grid
// code with the pointer resting on the table), which would leave the map
// highlighting a stale point.
watch(() => props.bounds, () => setHovered(null));

onUnmounted(() => {
	if (hoveredLabel.value) emit("hover", null);
});

function rowClass(row: Row) {
	const hovered = hoveredLabel.value === row.label;
	if (row.isCenter) return hovered ? "bg-success/25" : "bg-success/10";
	return hovered ? "bg-primary/10" : "";
}

const copiedFields = reactive(new Set<string>());
async function copyText(key: string, text: string) {
	await navigator.clipboard.writeText(text);
	copiedFields.add(key);
	setTimeout(() => copiedFields.delete(key), 2000);
}
</script>

<template>
	<UCard v-if="rows.length">
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
									:icon="copiedFields.has(`${row.label}-lat-dec`) ? 'i-lucide-check' : 'i-lucide-copy'"
									:color="copiedFields.has(`${row.label}-lat-dec`) ? 'primary' : 'neutral'"
									size="xs"
									variant="ghost"
									class="opacity-0 group-hover/dec:opacity-100 transition-opacity"
									:aria-label="`Kopiuj ${row.point.lat.toFixed(6)}`"
									@click="copyText(`${row.label}-lat-dec`, row.point.lat.toFixed(6))"
								/>
							</div>
							<div class="group/dms flex items-center justify-center gap-1 mt-0.5">
								<span class="text-xs text-muted">{{ toDMS(row.point.lat, true) }}</span>
								<UButton
									:icon="copiedFields.has(`${row.label}-lat-dms`) ? 'i-lucide-check' : 'i-lucide-copy'"
									:color="copiedFields.has(`${row.label}-lat-dms`) ? 'primary' : 'neutral'"
									size="xs"
									variant="ghost"
									class="opacity-0 group-hover/dms:opacity-100 transition-opacity"
									:aria-label="`Kopiuj ${toDMS(row.point.lat, true)}`"
									@click="copyText(`${row.label}-lat-dms`, toDMS(row.point.lat, true))"
								/>
							</div>
						</td>
						<td class="py-2 px-3 text-center">
							<div class="group/dec flex items-center justify-center gap-1">
								<span class="font-mono font-bold text-primary">{{ row.point.lon.toFixed(6) }}</span>
								<UButton
									:icon="copiedFields.has(`${row.label}-lon-dec`) ? 'i-lucide-check' : 'i-lucide-copy'"
									:color="copiedFields.has(`${row.label}-lon-dec`) ? 'primary' : 'neutral'"
									size="xs"
									variant="ghost"
									class="opacity-0 group-hover/dec:opacity-100 transition-opacity"
									:aria-label="`Kopiuj ${row.point.lon.toFixed(6)}`"
									@click="copyText(`${row.label}-lon-dec`, row.point.lon.toFixed(6))"
								/>
							</div>
							<div class="group/dms flex items-center justify-center gap-1 mt-0.5">
								<span class="text-xs text-muted">{{ toDMS(row.point.lon, false) }}</span>
								<UButton
									:icon="copiedFields.has(`${row.label}-lon-dms`) ? 'i-lucide-check' : 'i-lucide-copy'"
									:color="copiedFields.has(`${row.label}-lon-dms`) ? 'primary' : 'neutral'"
									size="xs"
									variant="ghost"
									class="opacity-0 group-hover/dms:opacity-100 transition-opacity"
									:aria-label="`Kopiuj ${toDMS(row.point.lon, false)}`"
									@click="copyText(`${row.label}-lon-dms`, toDMS(row.point.lon, false))"
								/>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</UCard>
</template>
