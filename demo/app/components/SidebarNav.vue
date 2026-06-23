<script setup>
const route = useRoute();

const groups = [
	{
		items: [
			{ label: "Strona główna", icon: "i-lucide-house", to: "/" },
		],
	},
	{
		label: "Kalkulatory ATPOL",
		items: [
			{ label: "Kod ATPOL → Współrzędne", icon: "i-lucide-compass", to: "/kalkulator-odwrotny" },
			{ label: "Współrzędne → Kod ATPOL", icon: "i-lucide-map-pin", to: "/kalkulator-wprost" },
		],
	},
	{
		label: "Narzędzia",
		items: [
			{ label: "Konwerter DD/DMS", icon: "i-lucide-arrow-left-right", to: "/konwerter" },
		],
	},
];

function isActive(path) {
	return route.path === path;
}
</script>

<template>
	<aside class="hidden lg:flex flex-col w-56 shrink-0 border-r border-default sticky top-16 h-[calc(100dvh-4rem)] overflow-y-auto p-3 gap-4">
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
	</aside>
</template>
