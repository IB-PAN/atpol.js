<script setup lang="ts">
import type { ATPOL } from "../../../main";

const props = defineProps<{
	bounds: ATPOL.Bounds_LatLon | null;
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
		{ label: "ŚRODEK (Centrum)", point: props.bounds.center, isCenter: true },
		{ label: "NW (Górny Lewy)", point: props.bounds.nw },
		{ label: "NE (Górny Prawy)", point: props.bounds.ne },
		{ label: "SE (Dolny Prawy)", point: props.bounds.se },
		{ label: "SW (Dolny Lewy)", point: props.bounds.sw },
	];
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
