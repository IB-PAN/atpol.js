<script setup lang="ts">
import { ddToDmsString, parseDmsString, dmsToDd } from "~/utils/coord-utils";

useSeoMeta({
	title: "Konwerter współrzędnych DD/DMS",
	description: "Konwertuj współrzędne geograficzne między formatem stopni dziesiętnych (DD) a stopniami, minutami i sekundami (DMS).",
});

const copiedFields = reactive(new Set<string>());
async function copyText(key: string, text: string) {
	await navigator.clipboard.writeText(text);
	copiedFields.add(key);
	setTimeout(() => copiedFields.delete(key), 2000);
}

// --- DD → DMS ---
const ddInput = ref("");

const ddResult = computed(() => {
	if (!ddInput.value) return "";
	return ddToDmsString(ddInput.value) ?? "Nieprawidłowa wartość";
});

// --- DMS → DD ---
const dmsInput = reactive({ deg: "", min: "", sec: "" });

const dmsResult = computed(() => {
	if (!dmsInput.deg && !dmsInput.min && !dmsInput.sec) return "";
	if (!/^[0-9]*$/.test(dmsInput.deg.trim())
		|| !/^[0-9]*$/.test(dmsInput.min.trim())
		|| !/^([0-9]+([.,][0-9]+)?)?$/.test(dmsInput.sec.trim()))
		return "Nieprawidłowe wartości";
	const deg = parseFloat(dmsInput.deg.trim().replace(/,/g, ".")) || 0;
	const min = parseFloat(dmsInput.min.trim().replace(/,/g, ".")) || 0;
	const sec = parseFloat(dmsInput.sec.trim().replace(/,/g, ".")) || 0;
	return dmsToDd(deg, min, sec).toFixed(7);
});

function clearDmsInput() {
	dmsInput.deg = "";
	dmsInput.min = "";
	dmsInput.sec = "";
}

const dmsHasValue = computed(() => dmsInput.deg || dmsInput.min || dmsInput.sec);

// --- Parse DMS string → DD ---
const parseInput = ref("");

const parseResult = computed(() => {
	if (!parseInput.value) return "";
	const result = parseDmsString(parseInput.value);
	return result === null ? "Nieprawidłowy format" : result.toFixed(7);
});
</script>

<template>
	<div class="max-w-3xl">
		<div class="mb-6">
			<div class="flex items-center gap-2 mb-1">
				<UIcon
					name="i-lucide-arrow-left-right"
					class="text-primary size-6 shrink-0"
				/>
				<h1 class="text-2xl font-bold">
					Konwerter DD/DMS
				</h1>
			</div>
			<p class="text-muted">
				Konwertuj współrzędne geograficzne między formatem stopni dziesiętnych (DD)
				a stopniami, minutami i sekundami (DMS).
			</p>
		</div>

		<div class="grid lg:grid-cols-2 gap-6 mb-6">
			<!-- DD → DMS -->
			<UCard>
				<template #header>
					<div class="flex items-center gap-2 font-semibold">
						<UIcon
							name="i-lucide-chevrons-right"
							class="text-primary size-4"
						/>
						Stopnie dziesiętne → DMS
					</div>
				</template>

				<div class="flex flex-col gap-3">
					<UFormField
						label="Stopnie dziesiętne (DD)"
						hint="Wartość ujemna dla S / W"
					>
						<UInput
							v-model="ddInput"
							placeholder="np. 52.25"
							class="w-full font-mono"
						>
							<template #trailing>
								<UTooltip
									v-if="ddInput"
									text="Wyczyść"
									:delay-duration="0"
								>
									<UButton
										color="neutral"
										variant="ghost"
										icon="i-lucide-x"
										size="xs"
										aria-label="Wyczyść"
										@click="ddInput = ''"
									/>
								</UTooltip>
							</template>
						</UInput>
					</UFormField>

					<div class="flex items-center justify-between p-3 bg-elevated rounded-lg text-sm font-mono min-h-10">
						<div>
							<span class="text-muted text-xs not-italic font-sans">Wynik DMS:</span>
							<br>
							<span class="font-medium text-base">{{ ddResult || '—' }}</span>
						</div>
						<div
							v-if="ddResult && ddResult !== 'Nieprawidłowa wartość'"
							class="relative flex items-center shrink-0"
						>
							<Transition
								enter-active-class="transition-opacity duration-150"
								leave-active-class="transition-opacity duration-150"
								enter-from-class="opacity-0"
								leave-to-class="opacity-0"
							>
								<span
									v-if="copiedFields.has('dd')"
									class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
								>Skopiowano!</span>
							</Transition>
							<UTooltip
								text="Kopiuj do schowka"
								:delay-duration="0"
							>
								<UButton
									:icon="copiedFields.has('dd') ? 'i-lucide-check' : 'i-lucide-copy'"
									:color="copiedFields.has('dd') ? 'success' : 'neutral'"
									size="sm"
									variant="ghost"
									class="hover:bg-accented!"
									aria-label="Kopiuj wynik DMS"
									@click="copyText('dd', ddResult)"
								/>
							</UTooltip>
						</div>
					</div>
				</div>
			</UCard>

			<!-- DMS → DD -->
			<UCard>
				<template #header>
					<div class="flex items-center gap-2 font-semibold">
						<UIcon
							name="i-lucide-chevrons-left"
							class="text-primary size-4"
						/>
						DMS → Stopnie dziesiętne
					</div>
				</template>

				<div class="flex flex-col gap-3">
					<div class="flex items-end gap-2">
						<div class="grid grid-cols-3 gap-2 flex-1">
							<UFormField label="Stopnie (°)">
								<UInput
									v-model="dmsInput.deg"
									placeholder="52"
									class="w-full font-mono"
								>
									<template #trailing>
										<UTooltip
											v-if="dmsInput.deg"
											text="Wyczyść"
											:delay-duration="0"
										>
											<UButton
												color="neutral"
												variant="ghost"
												icon="i-lucide-x"
												size="xs"
												aria-label="Wyczyść"
												@click="dmsInput.deg = ''"
											/>
										</UTooltip>
									</template>
								</UInput>
							</UFormField>
							<UFormField label="Minuty (')">
								<UInput
									v-model="dmsInput.min"
									placeholder="0"
									class="w-full font-mono"
								>
									<template #trailing>
										<UTooltip
											v-if="dmsInput.min"
											text="Wyczyść"
											:delay-duration="0"
										>
											<UButton
												color="neutral"
												variant="ghost"
												icon="i-lucide-x"
												size="xs"
												aria-label="Wyczyść"
												@click="dmsInput.min = ''"
											/>
										</UTooltip>
									</template>
								</UInput>
							</UFormField>
							<UFormField label="Sekundy (&quot;)">
								<UInput
									v-model="dmsInput.sec"
									placeholder="0.0"
									class="w-full font-mono"
								>
									<template #trailing>
										<UTooltip
											v-if="dmsInput.sec"
											text="Wyczyść"
											:delay-duration="0"
										>
											<UButton
												color="neutral"
												variant="ghost"
												icon="i-lucide-x"
												size="xs"
												aria-label="Wyczyść"
												@click="dmsInput.sec = ''"
											/>
										</UTooltip>
									</template>
								</UInput>
							</UFormField>
						</div>
						<UTooltip
							text="Wyczyść wszystko"
							:delay-duration="0"
						>
							<UButton
								color="neutral"
								variant="ghost"
								icon="i-lucide-x"
								size="sm"
								aria-label="Wyczyść wszystko"
								:disabled="!dmsHasValue"
								class="mb-0.5"
								@click="clearDmsInput"
							/>
						</UTooltip>
					</div>

					<div class="flex items-center justify-between p-3 bg-elevated rounded-lg text-sm font-mono min-h-10">
						<div>
							<span class="text-muted text-xs not-italic font-sans">Wynik DD:</span>
							<br>
							<span class="font-medium text-base">{{ dmsResult || '—' }}</span>
						</div>
						<div
							v-if="dmsResult && dmsResult !== 'Nieprawidłowe wartości'"
							class="relative flex items-center shrink-0"
						>
							<Transition
								enter-active-class="transition-opacity duration-150"
								leave-active-class="transition-opacity duration-150"
								enter-from-class="opacity-0"
								leave-to-class="opacity-0"
							>
								<span
									v-if="copiedFields.has('dms')"
									class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
								>Skopiowano!</span>
							</Transition>
							<UTooltip
								text="Kopiuj do schowka"
								:delay-duration="0"
							>
								<UButton
									:icon="copiedFields.has('dms') ? 'i-lucide-check' : 'i-lucide-copy'"
									:color="copiedFields.has('dms') ? 'success' : 'neutral'"
									size="sm"
									variant="ghost"
									class="hover:bg-accented!"
									aria-label="Kopiuj wynik DD"
									@click="copyText('dms', dmsResult)"
								/>
							</UTooltip>
						</div>
					</div>
				</div>
			</UCard>
		</div>

		<!-- Parse DMS string → DD -->
		<UCard>
			<template #header>
				<div class="flex items-center gap-2 font-semibold">
					<UIcon
						name="i-lucide-scan-text"
						class="text-primary size-4"
					/>
					Parsowanie ciągu DMS → DD
				</div>
			</template>

			<div class="flex flex-col gap-3">
				<UFormField
					label="Ciąg DMS"
					hint="Obsługiwane formaty: 43°46′31.8″  lub  43 46 31.8"
				>
					<UInput
						v-model="parseInput"
						placeholder="43°46′31.8″"
						class="w-full font-mono"
					>
						<template #trailing>
							<UTooltip
								v-if="parseInput"
								text="Wyczyść"
								:delay-duration="0"
							>
								<UButton
									color="neutral"
									variant="ghost"
									icon="i-lucide-x"
									size="xs"
									aria-label="Wyczyść"
									@click="parseInput = ''"
								/>
							</UTooltip>
						</template>
					</UInput>
				</UFormField>

				<div class="flex items-center justify-between p-3 bg-elevated rounded-lg text-sm font-mono min-h-10">
					<div>
						<span class="text-muted text-xs not-italic font-sans">Wynik DD:</span>
						<br>
						<span class="font-medium text-base">{{ parseResult || '—' }}</span>
					</div>
					<div
						v-if="parseResult && parseResult !== 'Nieprawidłowy format'"
						class="relative flex items-center shrink-0"
					>
						<Transition
							enter-active-class="transition-opacity duration-150"
							leave-active-class="transition-opacity duration-150"
							enter-from-class="opacity-0"
							leave-to-class="opacity-0"
						>
							<span
								v-if="copiedFields.has('parse')"
								class="absolute right-full top-1/2 -translate-y-1/2 mr-4 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
							>Skopiowano!</span>
						</Transition>
						<UTooltip
							text="Kopiuj do schowka"
							:delay-duration="0"
						>
							<UButton
								:icon="copiedFields.has('parse') ? 'i-lucide-check' : 'i-lucide-copy'"
								:color="copiedFields.has('parse') ? 'success' : 'neutral'"
								size="sm"
								variant="ghost"
								class="hover:bg-accented!"
								aria-label="Kopiuj wynik DD"
								@click="copyText('parse', parseResult)"
							/>
						</UTooltip>
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>
