// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: [
		"@nuxt/eslint",
		"@nuxt/ui",
		"@nuxt/scripts",
		"@nuxt/a11y",
		"@nuxt/hints",
	],

	ssr: false,

	devtools: {
		enabled: true,
	},

	css: ["~/assets/css/main.css"],

	routeRules: {
		"/": { prerender: true },
		"/calculator-to-grid-code/": { prerender: true },
		"/calculator-from-grid-code/": { prerender: true },
		"/converter/": { prerender: true },
		"/map/": { prerender: true },
		"/docs/": { prerender: true },
	},

	vite: {
		server: {
			fs: {
				allow: [".."],
			},
		},
	},

	compatibilityDate: "2025-01-15",

	eslint: {
		config: {
			stylistic: {
				commaDangle: "always-multiline",
				braceStyle: "1tbs",
				semi: true,
				quotes: "double",
				indent: "tab",
			},
		},
	},

	icon: {
		mode: "css",
		cssLayer: "base",
		provider: "iconify",
		clientBundle: {
			// Automatically includes statically-detected icon usages
			scan: {
				globInclude: ["**\/*.{vue,js,ts,jsx,tsx,md,mdc,mdx}"],
			},
			// Keep explicit entries for dynamic icon names
			icons: [
				"lucide:loader-circle",
				"lucide:chevron-down",
				"lucide:chevron-right",
				"lucide:chevron-left",
				"lucide:moon",
				"lucide:sun",
				"lucide:menu",
			],
		},
		serverBundle: false,
	},
});
