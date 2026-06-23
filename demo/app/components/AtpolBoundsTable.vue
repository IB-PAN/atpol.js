<script setup lang="ts">
import type { ATPOL } from "../../../main.ts";

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
</template>
