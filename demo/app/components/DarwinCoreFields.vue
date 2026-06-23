<script setup lang="ts">
import { ATPOL } from "../../../main.ts";

}>();

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
				Wartości Darwin Core (WKT)
			</h2>
			<UTooltip
				text="Wartości WKT (Well-Known Text) gotowe do użycia w danych Darwin Core (GBIF)"
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
								v-if="copiedFields.has('polygon')"
								class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
							>Skopiowano!</span>
						</Transition>
						<UTooltip
							text="Kopiuj do schowka"
							:delay-duration="0"
						>
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
							<span
								v-if="copiedFields.has('srs')"
								class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
							>Skopiowano!</span>
						</Transition>
						<UTooltip
							text="Kopiuj do schowka"
							:delay-duration="0"
						>
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

			<!-- centroid WKT -->
			<div>
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
			</div>
		</div>
	</UCard>
</template>
