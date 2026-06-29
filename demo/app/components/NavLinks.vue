<script setup lang="ts">
const route = useRoute();

const groups = [
	{
		items: [
			{ label: "Strona główna", icon: "i-lucide-house", to: "/" },
			{ label: "Dokumentacja biblioteki", icon: "i-lucide-book-open", to: "/docs/" },
		],
	},
	{
		label: "Kalkulatory ATPOL",
		items: [
			{ label: "Kod ATPOL → Współrzędne", icon: "i-lucide-compass", to: "/calculator-from-grid-code/" },
			{ label: "Współrzędne → Kod ATPOL", icon: "i-lucide-map-pin", to: "/calculator-to-grid-code/" },
		],
	},
	{
		label: "Narzędzia",
		items: [
			{ label: "Konwerter DD/DMS", icon: "i-lucide-arrow-left-right", to: "/converter/" },
		],
	},
];

function isActive(path: string): boolean {
	return route.path === path;
}
</script>

<template>
	<div
		v-for="(group, i) in groups"
		:key="i"
		class="flex flex-col gap-0.5"
	>
		<p
			v-if="group.label"
			class="px-2 py-1 text-xs font-semibold text-muted uppercase tracking-wider"
		>
			{{ group.label }}
		</p>
		<UButton
			v-for="item in group.items"
			:key="item.to"
			:to="item.to"
			:icon="item.icon"
			:label="item.label"
			:color="isActive(item.to) ? 'primary' : 'neutral'"
			:variant="isActive(item.to) ? 'soft' : 'ghost'"
			class="w-full justify-start"
			size="sm"
		/>
	</div>
</template>
