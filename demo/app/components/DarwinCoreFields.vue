<script setup lang="ts">
import { ATPOL } from "../../../main.ts";

const props = defineProps<{
	atpolCode: string;
}>();

const wktPolygon = computed(() => ATPOL.grid_to_polygonWKT(props.atpolCode));
const wktCentroid = computed(() => ATPOL.grid_to_centroidWKT(props.atpolCode));
const bounds = computed(() => ATPOL.grid_to_latlon_bounds(props.atpolCode));
const decimalLatitude = computed(() => bounds.value.center.lat.toString());
const decimalLongitude = computed(() => bounds.value.center.lon.toString());
const coordinateUncertaintyInMeters = computed(() => ATPOL.grid_to_coordinate_uncertainty_in_meters(props.atpolCode));

const georeferenceProtocol = computed(() => {
	const m = ATPOL.grid_to_square_side_in_meters(props.atpolCode);
	const sizeStr = m >= 1000 ? `${m / 1000}×${m / 1000} km` : `${m}×${m} m`;
	return `Coordinates represent the centroid of an ATPOL ${sizeStr} grid`;
});

const footprintSRS = "EPSG:4326"; // WGS84
const geodeticDatum = "EPSG:4326"; // WGS84
const verbatimCoordinateSystem = "ATPOL";
const georeferenceSources = "ATPOL (Polish geobotanical grid)";

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
			<!-- footprintWKT -->
			<div>
				<div class="flex items-center gap-2 mb-1">
					<code class="text-xs bg-elevated px-1.5 py-0.5 rounded font-mono text-primary">footprintWKT</code>
					<span class="text-muted text-xs">Poligon (obrys kwadratu)</span>
					<UTooltip
						text="Wypełnienie tego pola w rekordzie Darwin Core umożliwia GBIF-owi rozpoznanie oraz wyświetlenie na mapie wskazanego faktycznego obszaru (zamiast pinezki z punktem centralnym i kołem o promieniu niedokładności)."
						:delay-duration="0"
					>
						<UIcon
							name="i-lucide-info"
							class="text-muted size-4 cursor-help"
						/>
					</UTooltip>
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
							<span
								v-if="copiedFields.has('footprintWKT')"
								class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
							>Skopiowano!</span>
						</Transition>
						<UTooltip
							text="Kopiuj do schowka"
							:delay-duration="0"
						>
							<UButton
								:icon="copiedFields.has('footprintWKT') ? 'i-lucide-check' : 'i-lucide-copy'"
								:color="copiedFields.has('footprintWKT') ? 'success' : 'neutral'"
								size="sm"
								variant="ghost"
								aria-label="Kopiuj footprintWKT"
								@click="copyText('footprintWKT', wktPolygon)"
							/>
						</UTooltip>
					</div>
				</div>
			</div>

			<!-- footprintSRS -->
			<div>
				<div class="flex items-center gap-2 mb-1">
					<code class="text-xs bg-elevated px-1.5 py-0.5 rounded font-mono text-primary">footprintSRS</code>
					<span class="text-muted text-xs">Układ odniesienia (dot. pola footprintWKT)</span>
					<UTooltip
						text="EPSG:4326 odpowiada układowi WGS84 — standardowemu układowi stosowanemu w GPS i większości danych geograficznych."
						:delay-duration="0"
					>
						<UIcon
							name="i-lucide-info"
							class="text-muted size-4 cursor-help"
						/>
					</UTooltip>
				</div>
				<div class="flex items-center gap-2">
					<input
						:value="footprintSRS"
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
								v-if="copiedFields.has('footprintSRS')"
								class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
							>Skopiowano!</span>
						</Transition>
						<UTooltip
							text="Kopiuj do schowka"
							:delay-duration="0"
						>
							<UButton
								:icon="copiedFields.has('footprintSRS') ? 'i-lucide-check' : 'i-lucide-copy'"
								:color="copiedFields.has('footprintSRS') ? 'success' : 'neutral'"
								size="sm"
								variant="ghost"
								aria-label="Kopiuj footprintSRS"
								@click="copyText('footprintSRS', footprintSRS)"
							/>
						</UTooltip>
					</div>
				</div>
			</div>

			<!-- centroid WKT -->
			<!-- <div>
				<div class="flex items-center gap-2 mb-1">
					<span class="text-muted text-xs">Centroid (punkt środkowy WKT)</span>
					<UTooltip
						text="Wartość pomocnicza — WKT punktu centralnego kwadratu. Nie jest standardowym polem Darwin Core, ale może być przydatna."
						:delay-duration="0"
					>
						<UIcon
							name="i-lucide-info"
							class="text-muted size-4 cursor-help"
						/>
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
							<span
								v-if="copiedFields.has('centroid')"
								class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
							>Skopiowano!</span>
						</Transition>
						<UTooltip
							text="Kopiuj do schowka"
							:delay-duration="0"
						>
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
			</div> -->

			<hr class="border-muted my-2">

			<!-- decimalLatitude -->
			<div>
				<div class="flex items-center gap-2 mb-1">
					<code class="text-xs bg-elevated px-1.5 py-0.5 rounded font-mono text-primary">decimalLatitude</code>
					<span class="text-muted text-xs">Szerokość geograficzna środka</span>
				</div>
				<div class="flex items-center gap-2">
					<input
						:value="decimalLatitude"
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
								v-if="copiedFields.has('decimalLatitude')"
								class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
							>Skopiowano!</span>
						</Transition>
						<UTooltip
							text="Kopiuj do schowka"
							:delay-duration="0"
						>
							<UButton
								:icon="copiedFields.has('decimalLatitude') ? 'i-lucide-check' : 'i-lucide-copy'"
								:color="copiedFields.has('decimalLatitude') ? 'success' : 'neutral'"
								size="sm"
								variant="ghost"
								aria-label="Kopiuj decimalLatitude"
								@click="copyText('decimalLatitude', decimalLatitude)"
							/>
						</UTooltip>
					</div>
				</div>
			</div>

			<!-- decimalLongitude -->
			<div>
				<div class="flex items-center gap-2 mb-1">
					<code class="text-xs bg-elevated px-1.5 py-0.5 rounded font-mono text-primary">decimalLongitude</code>
					<span class="text-muted text-xs">Długość geograficzna środka</span>
				</div>
				<div class="flex items-center gap-2">
					<input
						:value="decimalLongitude"
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
								v-if="copiedFields.has('decimalLongitude')"
								class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
							>Skopiowano!</span>
						</Transition>
						<UTooltip
							text="Kopiuj do schowka"
							:delay-duration="0"
						>
							<UButton
								:icon="copiedFields.has('decimalLongitude') ? 'i-lucide-check' : 'i-lucide-copy'"
								:color="copiedFields.has('decimalLongitude') ? 'success' : 'neutral'"
								size="sm"
								variant="ghost"
								aria-label="Kopiuj decimalLongitude"
								@click="copyText('decimalLongitude', decimalLongitude)"
							/>
						</UTooltip>
					</div>
				</div>
			</div>

			<!-- geodeticDatum -->
			<div>
				<div class="flex items-center gap-2 mb-1">
					<code class="text-xs bg-elevated px-1.5 py-0.5 rounded font-mono text-primary">geodeticDatum</code>
					<span class="text-muted text-xs">Układ odniesienia (dot. pól decimalLatitude i decimalLongitude)</span>
					<UTooltip
						text="EPSG:4326 odpowiada układowi WGS84 — standardowemu układowi stosowanemu w GPS i większości danych geograficznych."
						:delay-duration="0"
					>
						<UIcon
							name="i-lucide-info"
							class="text-muted size-4 cursor-help"
						/>
					</UTooltip>
				</div>
				<div class="flex items-center gap-2">
					<input
						:value="geodeticDatum"
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
								v-if="copiedFields.has('geodeticDatum')"
								class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
							>Skopiowano!</span>
						</Transition>
						<UTooltip
							text="Kopiuj do schowka"
							:delay-duration="0"
						>
							<UButton
								:icon="copiedFields.has('geodeticDatum') ? 'i-lucide-check' : 'i-lucide-copy'"
								:color="copiedFields.has('geodeticDatum') ? 'success' : 'neutral'"
								size="sm"
								variant="ghost"
								aria-label="Kopiuj geodeticDatum"
								@click="copyText('geodeticDatum', geodeticDatum)"
							/>
						</UTooltip>
					</div>
				</div>
			</div>

			<!-- coordinateUncertaintyInMeters -->
			<div>
				<div class="flex items-center gap-2 mb-1">
					<code class="text-xs bg-elevated px-1.5 py-0.5 rounded font-mono text-primary">coordinateUncertaintyInMeters</code>
					<span class="text-muted text-xs">Promień wokół środka w metrach</span>
					<UTooltip
						text="To pole w połączeniu ze współrzędnymi środka pozwala na zakreślenie obszaru obejmującego dany kwadrat ATPOL. Stanowi uproszczoną alternatywę dla prawdziwego obrysu podanego w polu footprintWKT, pełniąc funkcję uzupełniającą (nie każdy użytkownik danych będzie potrafił skorzystać z pól footprint)."
						:delay-duration="0"
					>
						<UIcon
							name="i-lucide-info"
							class="text-muted size-4 cursor-help"
						/>
					</UTooltip>
				</div>
				<div class="flex items-center gap-2">
					<input
						:value="coordinateUncertaintyInMeters"
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
								v-if="copiedFields.has('coordinateUncertaintyInMeters')"
								class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
							>Skopiowano!</span>
						</Transition>
						<UTooltip
							text="Kopiuj do schowka"
							:delay-duration="0"
						>
							<UButton
								:icon="copiedFields.has('coordinateUncertaintyInMeters') ? 'i-lucide-check' : 'i-lucide-copy'"
								:color="copiedFields.has('coordinateUncertaintyInMeters') ? 'success' : 'neutral'"
								size="sm"
								variant="ghost"
								aria-label="Kopiuj coordinateUncertaintyInMeters"
								@click="copyText('coordinateUncertaintyInMeters', coordinateUncertaintyInMeters.toString())"
							/>
						</UTooltip>
					</div>
				</div>
			</div>

			<hr class="border-muted my-2">

			<!-- verbatimCoordinates -->
			<div>
				<div class="flex items-center gap-2 mb-1">
					<code class="text-xs bg-elevated px-1.5 py-0.5 rounded font-mono text-primary">verbatimCoordinates</code>
					<span class="text-muted text-xs">Oryginalne współrzędne</span>
					<UTooltip
						text="W tym polu podajemy surowy kod ATPOL."
						:delay-duration="0"
					>
						<UIcon
							name="i-lucide-info"
							class="text-muted size-4 cursor-help"
						/>
					</UTooltip>
				</div>
				<div class="flex items-center gap-2">
					<input
						:value="props.atpolCode"
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
								v-if="copiedFields.has('verbatimCoordinates')"
								class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
							>Skopiowano!</span>
						</Transition>
						<UTooltip
							text="Kopiuj do schowka"
							:delay-duration="0"
						>
							<UButton
								:icon="copiedFields.has('verbatimCoordinates') ? 'i-lucide-check' : 'i-lucide-copy'"
								:color="copiedFields.has('verbatimCoordinates') ? 'success' : 'neutral'"
								size="sm"
								variant="ghost"
								aria-label="Kopiuj verbatimCoordinates"
								@click="copyText('verbatimCoordinates', props.atpolCode)"
							/>
						</UTooltip>
					</div>
				</div>
			</div>

			<!-- verbatimCoordinateSystem -->
			<div>
				<div class="flex items-center gap-2 mb-1">
					<code class="text-xs bg-elevated px-1.5 py-0.5 rounded font-mono text-primary">verbatimCoordinateSystem</code>
					<span class="text-muted text-xs">System oryginalnych współrzędnych</span>
				</div>
				<div class="flex items-center gap-2">
					<input
						:value="verbatimCoordinateSystem"
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
								v-if="copiedFields.has('verbatimCoordinateSystem')"
								class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
							>Skopiowano!</span>
						</Transition>
						<UTooltip
							text="Kopiuj do schowka"
							:delay-duration="0"
						>
							<UButton
								:icon="copiedFields.has('verbatimCoordinateSystem') ? 'i-lucide-check' : 'i-lucide-copy'"
								:color="copiedFields.has('verbatimCoordinateSystem') ? 'success' : 'neutral'"
								size="sm"
								variant="ghost"
								aria-label="Kopiuj verbatimCoordinateSystem"
								@click="copyText('verbatimCoordinateSystem', verbatimCoordinateSystem)"
							/>
						</UTooltip>
					</div>
				</div>
			</div>

			<!-- georeferenceProtocol -->
			<div>
				<div class="flex items-center gap-2 mb-1">
					<code class="text-xs bg-elevated px-1.5 py-0.5 rounded font-mono text-primary">georeferenceProtocol</code>
					<span class="text-muted text-xs"></span>
				</div>
				<div class="flex items-center gap-2">
					<input
						:value="georeferenceProtocol"
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
								v-if="copiedFields.has('georeferenceProtocol')"
								class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
							>Skopiowano!</span>
						</Transition>
						<UTooltip
							text="Kopiuj do schowka"
							:delay-duration="0"
						>
							<UButton
								:icon="copiedFields.has('georeferenceProtocol') ? 'i-lucide-check' : 'i-lucide-copy'"
								:color="copiedFields.has('georeferenceProtocol') ? 'success' : 'neutral'"
								size="sm"
								variant="ghost"
								aria-label="Kopiuj georeferenceProtocol"
								@click="copyText('georeferenceProtocol', georeferenceProtocol)"
							/>
						</UTooltip>
					</div>
				</div>
			</div>

			<!-- georeferenceSources -->
			<div>
				<div class="flex items-center gap-2 mb-1">
					<code class="text-xs bg-elevated px-1.5 py-0.5 rounded font-mono text-primary">georeferenceSources</code>
					<span class="text-muted text-xs"></span>
				</div>
				<div class="flex items-center gap-2">
					<input
						:value="georeferenceSources"
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
								v-if="copiedFields.has('georeferenceSources')"
								class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
							>Skopiowano!</span>
						</Transition>
						<UTooltip
							text="Kopiuj do schowka"
							:delay-duration="0"
						>
							<UButton
								:icon="copiedFields.has('georeferenceSources') ? 'i-lucide-check' : 'i-lucide-copy'"
								:color="copiedFields.has('georeferenceSources') ? 'success' : 'neutral'"
								size="sm"
								variant="ghost"
								aria-label="Kopiuj georeferenceSources"
								@click="copyText('georeferenceSources', georeferenceSources)"
							/>
						</UTooltip>
					</div>
				</div>
			</div>
		</div>
	</UCard>
</template>
