<script setup lang="ts">
const props = defineProps<{
	open: boolean;
	filename: string;
	content: string;
	language: "xml" | "json";
}>();

const emit = defineEmits<{
	"update:open": [value: boolean];
	download: [];
}>();

const copiedFields = reactive(new Set<string>());
async function copyText(key: string, text: string) {
	await navigator.clipboard.writeText(text);
	copiedFields.add(key);
	setTimeout(() => copiedFields.delete(key), 2000);
}
</script>

<template>
	<UModal
		:open="props.open"
		:title="props.filename"
		:ui="{ content: 'max-w-5xl' }"
		@update:open="emit('update:open', $event)"
	>
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
							@click="copyText('preview', props.content)"
						/>
					</UTooltip>
				</div>
				<div class="overflow-auto max-h-[65vh]">
					<highlightjs :language="props.language" :code="props.content" />
				</div>
			</div>
		</template>
		<template #footer>
			<div class="flex justify-end gap-3">
				<UButton
					label="Zamknij"
					color="neutral"
					variant="ghost"
					@click="emit('update:open', false)"
				/>
				<UButton
					icon="i-lucide-download"
					label="Pobierz"
					@click="emit('download')"
				/>
			</div>
		</template>
	</UModal>
</template>
