// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: [
		"@nuxt/eslint",
		"@nuxt/ui",
		"@nuxt/scripts",
		"@nuxt/a11y",
		"@nuxt/hints",
	],

	devtools: {
		enabled: true,
	},

	css: ["~/assets/css/main.css"],

	routeRules: {
		"/": { prerender: true },
		"/calculator-to-grid-code/": { prerender: true },
		"/calculator-from-grid-code/": { prerender: true },
		"/converter/": { prerender: true },
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
		provider: "none",
		clientBundle: {
			scan: true,
		},
		serverBundle: false,
	},
});
