<script setup>
useSeoMeta({
  title: 'Kalkulator – współrzędne na kwadrat ATPOL',
  description: 'Znajdź kod kwadratu ATPOL na podstawie współrzędnych geograficznych.'
})

const mode = ref('dd')

const form = reactive({
  dd: { lat: '', lon: '' },
  dms: {
    lat: { deg: '', min: '', sec: '' },
    lon: { deg: '', min: '', sec: '' }
  },
  gridSize: '10km'
})

const gridSizes = [
  { label: '100×100 km', value: '100km' },
  { label: '10×10 km — standard', value: '10km' },
  { label: '5×5 km', value: '5km' },
  { label: '2×2 km', value: '2km' },
  { label: '1×1 km', value: '1km' },
  { label: '500×500 m', value: '500m' },
  { label: '200×200 m', value: '200m' },
  { label: '100×100 m', value: '100m' },
  { label: '50×50 m', value: '50m' },
  { label: '20×20 m (typ p)', value: '20m' }
]

function getLocation() {
  // TODO: implement GPS location retrieval
}

function calculate() {
  // TODO: implement ATPOL calculation
}
</script>

<template>
  <div class="max-w-2xl">
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-1">
        <UIcon name="i-lucide-map-pin" class="text-primary size-6 shrink-0" />
        <h1 class="text-2xl font-bold">
          Kalkulator – współrzędne na kod kwadratu ATPOL
        </h1>
      </div>
      <p class="text-muted">
        Znajdź kod kwadratu ATPOL na podstawie współrzędnych geograficznych.
      </p>
    </div>

    <UAlert
      icon="i-lucide-construction"
      color="warning"
      variant="soft"
      title="Strona w budowie"
      description="Funkcjonalność obliczeniowa w tym kalkulatorze nie jest jeszcze zaimplementowana. Interfejs jest poglądowy."
      class="mb-4"
    />

    <UCard class="mb-4">
      <div class="flex flex-col gap-4">
        <!-- GPS button -->
        <div>
          <UButton
            icon="i-lucide-crosshair"
            label="Pobierz moją lokalizację (GPS)"
            color="primary"
            variant="soft"
            @click="getLocation"
          />
        </div>

        <USeparator label="lub wpisz ręcznie" />

        <!-- Input mode toggle -->
        <div class="flex gap-2">
          <UButton
            label="Stopnie dziesiętne (DD)"
            size="sm"
            :color="mode === 'dd' ? 'primary' : 'neutral'"
            :variant="mode === 'dd' ? 'solid' : 'outline'"
            @click="mode = 'dd'"
          />
          <UButton
            label="Stopnie, minuty, sekundy (DMS)"
            size="sm"
            :color="mode === 'dms' ? 'primary' : 'neutral'"
            :variant="mode === 'dms' ? 'solid' : 'outline'"
            @click="mode = 'dms'"
          />
        </div>

        <!-- DD inputs -->
        <div v-if="mode === 'dd'" class="grid sm:grid-cols-2 gap-4">
          <UFormField label="Szerokość geograficzna (φ)" hint="np. 52.2500">
            <UInput
              v-model="form.dd.lat"
              placeholder="52.2500"
              class="w-full font-mono"
            />
          </UFormField>
          <UFormField label="Długość geograficzna (λ)" hint="np. 21.0000">
            <UInput
              v-model="form.dd.lon"
              placeholder="21.0000"
              class="w-full font-mono"
            />
          </UFormField>
        </div>

        <!-- DMS inputs -->
        <div v-else class="flex flex-col gap-4">
          <div>
            <p class="text-sm font-medium mb-2">
              Szerokość geograficzna (φ)
            </p>
            <div class="grid grid-cols-3 gap-2">
              <UFormField label="Stopnie (°)">
                <UInput v-model="form.dms.lat.deg" placeholder="52" class="w-full font-mono" />
              </UFormField>
              <UFormField label="Minuty (')">
                <UInput v-model="form.dms.lat.min" placeholder="15" class="w-full font-mono" />
              </UFormField>
              <UFormField label='Sekundy (")'>
                <UInput v-model="form.dms.lat.sec" placeholder="0.0" class="w-full font-mono" />
              </UFormField>
            </div>
          </div>
          <div>
            <p class="text-sm font-medium mb-2">
              Długość geograficzna (λ)
            </p>
            <div class="grid grid-cols-3 gap-2">
              <UFormField label="Stopnie (°)">
                <UInput v-model="form.dms.lon.deg" placeholder="21" class="w-full font-mono" />
              </UFormField>
              <UFormField label="Minuty (')">
                <UInput v-model="form.dms.lon.min" placeholder="0" class="w-full font-mono" />
              </UFormField>
              <UFormField label='Sekundy (")'>
                <UInput v-model="form.dms.lon.sec" placeholder="0.0" class="w-full font-mono" />
              </UFormField>
            </div>
          </div>
        </div>

        <!-- Grid size -->
        <UFormField label="Wielkość siatki">
          <USelect
            v-model="form.gridSize"
            :items="gridSizes"
            class="w-full sm:w-72"
          />
        </UFormField>

        <!-- Submit -->
        <div class="flex items-center gap-3 pt-2 border-t border-default">
          <UButton
            label="Podaj kody kwadratów"
            icon="i-lucide-search"
            :disabled="true"
            @click="calculate"
          />
          <p class="text-xs text-muted italic">
            Obliczenia wkrótce dostępne
          </p>
        </div>
      </div>
    </UCard>

    <!-- Results placeholder -->
    <UCard variant="subtle">
      <div class="text-center py-10 text-muted">
        <UIcon name="i-lucide-map" class="size-12 mx-auto mb-3 opacity-25" />
        <p class="font-medium">
          Tutaj pojawią się wyniki
        </p>
        <p class="text-sm">
          Wprowadź współrzędne i kliknij „Podaj kody kwadratów"
        </p>
      </div>
    </UCard>
  </div>
</template>
