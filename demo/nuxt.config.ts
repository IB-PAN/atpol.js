// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/a11y',
    '@nuxt/hints'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true },
    '/kalkulator-wprost': { prerender: true },
    '/kalkulator-odwrotny': { prerender: true },
    '/konwerter': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'only-multiline',
        braceStyle: '1tbs',
        semi: true,
        quotes: 'double',
        indent: 'tab'
      }
    }
  },

  icon: {
    clientBundle: {
      scan: true
    }
  }
})
