<script setup>
useSeoMeta({
  title: 'Kalkulatory ATPOL',
  description: 'Narzędzia do pracy z siatką ATPOL oparte na bibliotece atpol.js.'
})

const tools = [
  {
    to: '/kalkulator-odwrotny',
    icon: 'i-lucide-compass',
    title: 'Kod ATPOL → Współrzędne',
    description: 'Uzyskaj współrzędne centrum i wierzchołków kwadratu ATPOL na podstawie jego kodu.'
  },
  {
    to: '/kalkulator-wprost',
    icon: 'i-lucide-map-pin',
    title: 'Współrzędne → Kod ATPOL',
    description: 'Znajdź kod kwadratu ATPOL na podstawie współrzędnych geograficznych.'
  },
  {
    to: '/konwerter',
    icon: 'i-lucide-arrow-left-right',
    title: 'Konwerter DD/DMS',
    description: 'Konwertuj współrzędne geograficzne między formatem dziesiętnym (DD) a stopniami, minutami i sekundami (DMS).'
  }
]
</script>

<template>
  <div class="max-w-3xl">
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <UIcon name="i-lucide-grid-2x2" class="text-primary size-8 shrink-0" />
        <h1 class="text-3xl font-bold">
          Kalkulatory ATPOL
        </h1>
      </div>
      <p class="text-lg text-muted">
        Interaktywne narzędzia do pracy z geobotanicznym systemem kartograficznym ATPOL,
        oparte na bibliotece open source
        <UButton
          to="https://github.com/IB-PAN/atpol.js"
          target="_blank"
          label="atpol.js"
          variant="link"
          color="primary"
          class="px-0 font-semibold"
        />.
      </p>
    </div>

    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-3">
        O siatce ATPOL
      </h2>
      <p class="text-muted mb-3">
        ATPOL (<em>Atlas Rozmieszczenia Roślin Naczyniowych w Polsce</em>) to geobotaniczny system
        kartograficzny opracowany dla obszaru Polski. Siatka ATPOL
        dzieli terytorium Polski na hierarchiczne kwadraty o różnych rozmiarach — od 100×100 km
        aż do 20×20 m — identyfikowane unikalnymi kodami alfanumerycznymi.
      </p>
      <p class="text-muted mb-3">
        Biblioteka <strong>atpol.js</strong> udostępnia algorytmy ATPOL w TypeScript/JavaScript,
        umożliwiając programistyczną konwersję między współrzędnymi geograficznymi a kodami
        kwadratów siatki ATPOL.
      </p>
      <p class="text-muted">
        Więcej informacji o siatce ATPOL znajduje się na stronach:
        <ul class="list-disc ps-6 my-5 marker:text-(--ui-border-accented)">
          <li><a href="https://worldbig.org/atpol/" target="blank" class="underline">https://worldbig.org/atpol/</a></li>
          <li><a href="https://pl.wikipedia.org/wiki/AtPol" target="blank" class="underline">https://pl.wikipedia.org/wiki/AtPol</a></li>
          <li><a href="http://maxbot.botany.pl/cgi-bin/pubs/data/article_pdf?id=4279" target="blank" class="underline">Siatka ATPOL w analitycznym ujęciu</a></li>
          <li><a href="http://maxbot.botany.pl/cgi-bin/pubs/data/article_pdf?id=4302" target="blank" class="underline">Standaryzacja zapisu podziałów siatki ATPOL</a></li>
        </ul>
      </p>
    </div>

    <h2 class="text-xl font-semibold mb-4">
      Dostępne narzędzia
    </h2>
    <div class="grid gap-4 sm:grid-cols-1">
      <NuxtLink
        v-for="tool in tools"
        :key="tool.to"
        :to="tool.to"
        class="block"
      >
        <UCard class="h-full hover:ring-2 hover:ring-primary/40 transition-shadow cursor-pointer">
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2 font-semibold">
              <UIcon :name="tool.icon" class="text-primary size-5 shrink-0" />
              {{ tool.title }}
            </div>
            <p class="text-sm text-muted">
              {{ tool.description }}
            </p>
          </div>
        </UCard>
      </NuxtLink>
    </div>

    <USeparator class="my-8" />

    <p class="text-sm text-muted">
      Biblioteka <strong>atpol.js</strong> oraz niniejsze narzędzia zostały opracowane przez
      <strong>Michała Kulę</strong> z
      <UButton
        to="https://botany.edu.pl/"
        target="_blank"
        label="Instytutu Botaniki im. W. Szafera PAN w Krakowie"
        variant="link"
        color="neutral"
        class="px-0 text-sm font-normal underline"
      />.
    </p>
  </div>
</template>
