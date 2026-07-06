<script setup lang="ts">
import { ATPOL } from "../../../main";

const props = defineProps<{
	atpolCode: string;
}>();

type FieldItem = {
	type: "field";
	key: string;
	caption?: string;
	tooltip?: string;
	value: string;
	long?: boolean;
};

type SeparatorItem = {
	type: "separator";
};

type Item = FieldItem | SeparatorItem;

const fields = computed<Item[]>(() => {
	const dc = ATPOL.WP.grid_is_valid(props.atpolCode)
		? ATPOL.WP.grid_to_darwincore_fields(props.atpolCode)
		: ATPOL.grid_to_darwincore_fields(props.atpolCode);

	return [
		{
			type: "field",
			key: "footprintWKT",
			caption: "Poligon (obrys kwadratu)",
			tooltip: "Wypełnienie tego pola w rekordzie Darwin Core umożliwia GBIF-owi rozpoznanie oraz wyświetlenie na mapie wskazanego faktycznego obszaru (zamiast pinezki z punktem centralnym i kołem o promieniu niedokładności).",
			value: dc.footprintWKT,
			long: true,
		},
		{
			type: "field",
			key: "footprintSRS",
			caption: "Układ odniesienia (dot. pola footprintWKT)",
			tooltip: "EPSG:4326 odpowiada układowi WGS84 — standardowemu układowi stosowanemu w GPS i większości danych geograficznych.",
			value: dc.footprintSRS,
		},
		{ type: "separator" },
		{
			type: "field",
			key: "decimalLatitude",
			caption: "Szerokość geograficzna środka",
			value: dc.decimalLatitude,
		},
		{
			type: "field",
			key: "decimalLongitude",
			caption: "Długość geograficzna środka",
			value: dc.decimalLongitude,
		},
		{
			type: "field",
			key: "geodeticDatum",
			caption: "Układ odniesienia (dot. pól decimalLatitude i decimalLongitude)",
			tooltip: "EPSG:4326 odpowiada układowi WGS84 — standardowemu układowi stosowanemu w GPS i większości danych geograficznych.",
			value: dc.geodeticDatum,
		},
		{
			type: "field",
			key: "coordinateUncertaintyInMeters",
			caption: "Promień wokół środka w metrach",
			tooltip: "To pole w połączeniu ze współrzędnymi środka pozwala na zakreślenie obszaru obejmującego dany kwadrat ATPOL. Stanowi uproszczoną alternatywę dla prawdziwego obrysu podanego w polu footprintWKT, pełniąc funkcję uzupełniającą (nie każdy użytkownik danych będzie potrafił skorzystać z pól footprint).",
			value: dc.coordinateUncertaintyInMeters,
		},
		{ type: "separator" },
		{
			type: "field",
			key: "verbatimCoordinates",
			caption: "Oryginalne współrzędne",
			tooltip: "W tym polu podajemy surowy kod ATPOL.",
			value: dc.verbatimCoordinates,
		},
		{
			type: "field",
			key: "verbatimCoordinateSystem",
			caption: "System oryginalnych współrzędnych",
			value: dc.verbatimCoordinateSystem,
		},
		{
			type: "field",
			key: "georeferenceProtocol",
			value: dc.georeferenceProtocol,
			long: true,
		},
		{
			type: "field",
			key: "georeferenceSources",
			value: dc.georeferenceSources,
			long: true,
		},
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
	<UCard>
		<div class="flex items-center gap-2 mb-3">
			<UIcon
				name="i-lucide-map-pin"
				class="text-primary size-5 shrink-0"
			/>
			<h2 class="font-semibold text-sm">
				Wartości Darwin Core
			</h2>
			<UTooltip
				text="Wartości gotowe do użycia w danych Darwin Core (GBIF)"
				:delay-duration="0"
			>
				<UIcon
					name="i-lucide-info"
					class="text-muted size-4 cursor-help"
				/>
			</UTooltip>
		</div>

		<div class="flex flex-col gap-3 text-sm">
			<template
				v-for="(item, idx) in fields"
				:key="item.type === 'field' ? item.key : `sep-${idx}`"
			>
				<hr
					v-if="item.type === 'separator'"
					class="border-muted my-2"
				>
				<div v-else>
					<div class="flex items-center gap-2 mb-1">
						<code class="text-xs bg-elevated px-1.5 py-0.5 rounded font-mono text-primary">{{ item.key }}</code>
						<span
							v-if="item.caption"
							class="text-muted text-xs"
						>{{ item.caption }}</span>
						<UTooltip
							v-if="item.tooltip"
							:text="item.tooltip"
							:delay-duration="0"
						>
							<UIcon
								name="i-lucide-info"
								class="text-muted size-4 cursor-help"
							/>
						</UTooltip>
					</div>
					<div class="flex items-center gap-2">
						<div
							v-if="item.long"
							class="flex-1 min-w-0 font-mono text-xs bg-elevated border border-default rounded-md px-3 py-2 text-foreground whitespace-pre-wrap break-words"
						>{{ item.value }}</div>
						<input
							v-else
							:value="item.value"
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
								<span
									v-if="copiedFields.has(item.key)"
									class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
								>Skopiowano!</span>
							</Transition>
							<UTooltip
								text="Kopiuj do schowka"
								:delay-duration="0"
							>
								<UButton
									:icon="copiedFields.has(item.key) ? 'i-lucide-check' : 'i-lucide-copy'"
									:color="copiedFields.has(item.key) ? 'success' : 'neutral'"
									size="sm"
									variant="ghost"
									:aria-label="`Kopiuj ${item.key}`"
									@click="copyText(item.key, item.value)"
								/>
							</UTooltip>
						</div>
					</div>
				</div>
			</template>
		</div>
	</UCard>
</template>
