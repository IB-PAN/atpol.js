<script setup>
const { app: { baseURL } } = useRuntimeConfig();

if (import.meta.client && window.location.hostname === "ib-pan.github.io") {
  useScriptPlausibleAnalytics({
    scriptInput: {
      src: "https://botany.edu.pl/pa/js/pa-d8BECNQSzuTGL_7n2oI7x.js",
    },
    endpoint: "https://botany.edu.pl/pa/api/event",
  });
}

useHead({
  titleTemplate: t => t ? `${t} — atpol.js` : "atpol.js",
  htmlAttrs: { lang: "pl" },
  meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }],
  link: [{ rel: "icon", href: `${baseURL}favicon.ico` }],
})
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
          to="https://github.com/IB-PAN/atpol.js"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UHeader>

    <UMain>
      <div class="flex">
        <SidebarNav />
        <div class="flex-1 min-w-0 p-6 lg:p-8">
          <NuxtPage />
        </div>
      </div>
    </UMain>
  </UApp>
</template>
