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
	link: [
		{ rel: "icon", type: "image/svg+xml", href: `${baseURL}favicon.svg` },
		{ rel: "icon", type: "image/png", sizes: "32x32", href: `${baseURL}favicon-32x32.png` },
		{ rel: "icon", href: `${baseURL}favicon.ico` },
		{ rel: "apple-touch-icon", sizes: "180x180", href: `${baseURL}apple-touch-icon.png` },
	],
});

/* Favicon:
curl "https://api.iconify.design/lucide/grid-2x2.svg?color=%2300C16A" -o public/favicon.svg
sed -i 's/width="1em" height="1em"/width="24" height="24"/' public/favicon.svg

rsvg-convert -w 32 -h 32 public/favicon.svg -o public/favicon-32x32.png
rsvg-convert -w 180 -h 180 public/favicon.svg -o public/apple-touch-icon.png

rsvg-convert -w 16 -h 16 public/favicon.svg -o /tmp/icon-16.png
rsvg-convert -w 32 -h 32 public/favicon.svg -o /tmp/icon-32.png
rsvg-convert -w 48 -h 48 public/favicon.svg -o /tmp/icon-48.png
magick /tmp/icon-16.png /tmp/icon-32.png /tmp/icon-48.png public/favicon.ico
*/
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
