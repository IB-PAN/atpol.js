<script setup lang="ts">
const { app: { baseURL } } = useRuntimeConfig();

useScriptPlausible({
	scriptSrc: "https://botany.edu.pl/pa/js/pa-d8BECNQSzuTGL_7n2oI7x.js",
	domain: "ib-pan.github.io",
	endpoint: "https://botany.edu.pl/pa/api/event",
	fileExtensions: ["geojson", "kml", "zip"],
	scriptOptions: {
		trigger: "onNuxtReady",
	},
});

useHead({
	titleTemplate: t => t ? `${t} — atpol.js` : "atpol.js",
	htmlAttrs: { lang: "pl" },
	meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }],
	link: [{ rel: "icon", href: `${baseURL}favicon.ico` }],
});
</script>

<template>
	<UApp>
		<UHeader>
			<template #left>
				<NuxtLink to="/">
					<AppLogo />
				</NuxtLink>
			</template>

			<template #right>
				<UColorModeButton />
				<UButton
					to="https://www.npmjs.com/package/@ib-pan/atpol"
					target="_blank"
					icon="i-simple-icons-npm"
					aria-label="npm"
					color="neutral"
					variant="ghost"
				/>
				<UButton
					to="https://github.com/IB-PAN/atpol.js"
					target="_blank"
					icon="i-simple-icons-github"
					aria-label="GitHub"
					color="neutral"
					variant="ghost"
				/>
			</template>

			<template #body>
				<div class="flex flex-col gap-4 p-3">
					<NavLinks />
				</div>
			</template>
		</UHeader>

		<UMain>
			<div class="flex">
				<aside class="hidden lg:flex flex-col w-56 shrink-0 border-r border-default sticky top-16 h-[calc(100dvh-4rem)] overflow-y-auto p-3 gap-4">
					<NavLinks />
				</aside>
				<div class="flex-1 min-w-0 p-6 lg:p-8">
					<NuxtPage />
				</div>
			</div>
		</UMain>
	</UApp>
</template>
