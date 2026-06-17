<script setup>
useSeoMeta({
	title: 'Konwerter współrzędnych DD/DMS',
	description: 'Konwertuj współrzędne geograficzne między formatem stopni dziesiętnych (DD) a stopniami, minutami i sekundami (DMS).'
})

// --- DD → DMS ---
const ddInput = ref('')

function ddToDmsString(value) {
  value = value.trim();
	if (!/^([0-9]+([.,][0-9]+)?)?$/.test(value)) return null
	const num = parseFloat(value.replace(/,/g, "."))
	if (isNaN(num)) return null
	const abs = Math.abs(num)
	const sign = num < 0 ? '-' : ''
	const deg = Math.floor(abs)
	const minFull = (abs - deg) * 60
	const min = Math.floor(minFull)
	const sec = ((minFull - min) * 60).toFixed(4)
	return `${sign}${deg}° ${min}' ${sec}"`
}

const ddResult = computed(() => {
	if (!ddInput.value) return ''
	return ddToDmsString(ddInput.value) ?? 'Nieprawidłowa wartość'
})

// --- DMS → DD ---
const dmsInput = reactive({ deg: '', min: '', sec: '' })

const dmsResult = computed(() => {
	if (!dmsInput.deg && !dmsInput.min && !dmsInput.sec) return ''
	if (!/^[0-9]*$/.test(dmsInput.deg.trim())
    || !/^[0-9]*$/.test(dmsInput.min.trim())
    || !/^([0-9]+([.,][0-9]+)?)?$/.test(dmsInput.sec.trim()))
    return 'Nieprawidłowe wartości'
	const deg = parseFloat(dmsInput.deg.trim().replace(/,/g, ".")) || 0
	const min = parseFloat(dmsInput.min.trim().replace(/,/g, ".")) || 0
	const sec = parseFloat(dmsInput.sec.trim().replace(/,/g, ".")) || 0
	const sign = deg < 0 ? -1 : 1
	return (sign * (Math.abs(deg) + min / 60 + sec / 3600)).toFixed(7)
})

function clearDmsInput() {
	dmsInput.deg = ''
	dmsInput.min = ''
	dmsInput.sec = ''
}

const dmsHasValue = computed(() => dmsInput.deg || dmsInput.min || dmsInput.sec)

// --- Parse DMS string → DD ---
const parseInput = ref('')

function parseDmsString(str) {
	const cleaned = str
    .replace(/(?:[""”″²]|''|′′)/g, ' ')
    .replace(/['′¢]/g, ' ')
		.replace(/[°º˚*]/g, ' ')
		.replace(/\s+/g, ' ')
		.replace(/,/g, '.')
		.trim()
	const parts = cleaned.split(' ').filter(p => p !== '')
	if (parts.length < 1) return null
	const deg = parseFloat(parts[0])
	const min = parseFloat(parts[1]) || 0
	const sec = parseFloat(parts[2]) || 0
	if (isNaN(deg)) return null
	const sign = deg < 0 ? -1 : 1
	return sign * (Math.abs(deg) + min / 60 + sec / 3600)
}

const parseResult = computed(() => {
	if (!parseInput.value) return ''
	const result = parseDmsString(parseInput.value)
	return result === null ? 'Nieprawidłowy format' : result.toFixed(7)
})
</script>

<template>
  <div class="max-w-3xl">
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-1">
        <UIcon name="i-lucide-arrow-left-right" class="text-primary size-6 shrink-0" />
        <h1 class="text-2xl font-bold">
          Konwerter DD/DMS
        </h1>
      </div>
      <p class="text-muted">
        Konwertuj współrzędne geograficzne między formatem stopni dziesiętnych (DD)
        a stopniami, minutami i sekundami (DMS).
      </p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- DD → DMS -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2 font-semibold">
            <UIcon name="i-lucide-chevrons-right" class="text-primary size-4" />
            Stopnie dziesiętne → DMS
          </div>
        </template>

        <div class="flex flex-col gap-3">
          <UFormField label="Stopnie dziesiętne (DD)" hint="Wartość ujemna dla S / W">
            <UInput
              v-model="ddInput"
              placeholder="np. 52.25"
              class="w-full font-mono"
            >
              <template #trailing>
                <UTooltip v-if="ddInput" text="Wyczyść" :delay-duration="0">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-x"
                    size="xs"
                    aria-label="Wyczyść"
                    @click="ddInput = ''"
                  />
                </UTooltip>
              </template>
            </UInput>
          </UFormField>

          <div class="p-3 bg-elevated rounded-lg text-sm font-mono min-h-10">
            <span class="text-muted text-xs not-italic font-sans">Wynik DMS:</span>
            <br>
            <span class="font-medium text-base">{{ ddResult || '—' }}</span>
          </div>
        </div>
      </UCard>

      <!-- DMS → DD -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2 font-semibold">
            <UIcon name="i-lucide-chevrons-left" class="text-primary size-4" />
            DMS → Stopnie dziesiętne
          </div>
        </template>

        <div class="flex flex-col gap-3">
          <div class="flex items-end gap-2">
            <div class="grid grid-cols-3 gap-2 flex-1">
              <UFormField label="Stopnie (°)">
                <UInput v-model="dmsInput.deg" placeholder="52" class="w-full font-mono">
                  <template #trailing>
                    <UTooltip v-if="dmsInput.deg" text="Wyczyść" :delay-duration="0">
                      <UButton
                        color="neutral"
                        variant="ghost"
                        icon="i-lucide-x"
                        size="xs"
                        aria-label="Wyczyść"
                        @click="dmsInput.deg = ''"
                      />
                    </UTooltip>
                  </template>
                </UInput>
              </UFormField>
              <UFormField label="Minuty (')">
                <UInput v-model="dmsInput.min" placeholder="0" class="w-full font-mono">
                  <template #trailing>
                    <UTooltip v-if="dmsInput.min" text="Wyczyść" :delay-duration="0">
                      <UButton
                        color="neutral"
                        variant="ghost"
                        icon="i-lucide-x"
                        size="xs"
                        aria-label="Wyczyść"
                        @click="dmsInput.min = ''"
                      />
                    </UTooltip>
                  </template>
                </UInput>
              </UFormField>
              <UFormField label='Sekundy (")'>
                <UInput v-model="dmsInput.sec" placeholder="0.0" class="w-full font-mono">
                  <template #trailing>
                    <UTooltip v-if="dmsInput.sec" text="Wyczyść" :delay-duration="0">
                      <UButton
                        color="neutral"
                        variant="ghost"
                        icon="i-lucide-x"
                        size="xs"
                        aria-label="Wyczyść"
                        @click="dmsInput.sec = ''"
                      />
                    </UTooltip>
                  </template>
                </UInput>
              </UFormField>
            </div>
            <UTooltip text="Wyczyść wszystko" :delay-duration="0">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                size="sm"
                aria-label="Wyczyść wszystko"
                :disabled="!dmsHasValue"
                class="mb-0.5"
                @click="clearDmsInput"
              />
            </UTooltip>
          </div>

          <div class="p-3 bg-elevated rounded-lg text-sm font-mono min-h-10">
            <span class="text-muted text-xs not-italic font-sans">Wynik DD:</span>
            <br>
            <span class="font-medium text-base">{{ dmsResult || '—' }}</span>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Parse DMS string → DD -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2 font-semibold">
          <UIcon name="i-lucide-scan-text" class="text-primary size-4" />
          Parsowanie ciągu DMS → DD
        </div>
      </template>

      <div class="flex flex-col gap-3">
        <UFormField
          label="Ciąg DMS"
          hint='Obsługiwane formaty: 43°46′31.8″  lub  43 46 31.8'
        >
          <UInput
            v-model="parseInput"
            placeholder="43°46′31.8″"
            class="w-full font-mono"
          >
            <template #trailing>
              <UTooltip v-if="parseInput" text="Wyczyść" :delay-duration="0">
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-x"
                  size="xs"
                  aria-label="Wyczyść"
                  @click="parseInput = ''"
                />
              </UTooltip>
            </template>
          </UInput>
        </UFormField>

        <div class="p-3 bg-elevated rounded-lg text-sm font-mono min-h-10">
          <span class="text-muted text-xs not-italic font-sans">Wynik DD:</span>
          <br>
          <span class="font-medium text-base">{{ parseResult || '—' }}</span>
        </div>
      </div>
    </UCard>
  </div>
</template>
