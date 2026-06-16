<script setup>
useHead({
  titleTemplate: t => t ? `${t} — atpol.js` : "atpol.js",
  htmlAttrs: { lang: "pl" },
  meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }],
  link: [{ rel: "icon", href: "/favicon.ico" }],
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
