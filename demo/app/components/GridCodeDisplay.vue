<script setup lang="ts">
const props = defineProps<{
	code: string;
	display: string;
	textClass?: string;
}>();

const segments = computed(() => props.display ? props.display.split(" ") : []);

const copied = ref(false);
async function copyCode() {
	await navigator.clipboard.writeText(props.code);
	copied.value = true;
	setTimeout(() => { copied.value = false; }, 2000);
}
</script>

<template>
	<div class="flex items-center justify-center gap-2">
		<div
			:class="['flex font-mono', textClass]"
			style="gap: 0.2em"
		>
			<span
				v-for="(seg, i) in segments"
				:key="i"
			>{{ seg }}</span>
		</div>
		<div class="relative flex items-center">
			<Transition
				enter-active-class="transition-opacity duration-150"
				leave-active-class="transition-opacity duration-150"
				enter-from-class="opacity-0"
				leave-to-class="opacity-0"
			>
				<span
					v-if="copied"
					class="absolute right-full top-1/2 -translate-y-1/2 mr-2 whitespace-nowrap text-xs font-medium text-success bg-elevated border border-success/40 shadow-sm px-1.5 py-0.5 rounded z-10"
				>Skopiowano!</span>
			</Transition>
			<UTooltip
				text="Kopiuj do schowka"
				:delay-duration="0"
			>
				<UButton
					:icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
					:color="copied ? 'success' : 'neutral'"
					size="sm"
					variant="ghost"
					:aria-label="`Kopiuj ${code}`"
					@click="copyCode"
				/>
			</UTooltip>
		</div>
	</div>
</template>
