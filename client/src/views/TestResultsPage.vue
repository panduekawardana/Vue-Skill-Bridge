<script setup>
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import Card from "@/components/ui/Card.vue"
import Badge from "@/components/ui/Badge.vue"
import Button from "@/components/ui/Button.vue"
import { api } from "@/lib/api"
import { BarChart3, ChevronDown, ChevronRight, Medal, Target } from "@lucide/vue"
import DashboardLayout from "@/components/layout/DashboardLayout.vue"

const router = useRouter()
const results = ref([])
const loading = ref(true)
const expanded = ref({})

function toggleExpand(id) {
  expanded.value[id] = !expanded.value[id]
}

const averageScore = computed(() => {
  if (results.value.length === 0) return 0
  const sum = results.value.reduce((a, r) => a + (r.overallScore || 0), 0)
  return Math.round(sum / results.value.length)
})

onMounted(async () => {
  try {
    results.value = await api.get("/skill-test/results")
  } catch (e) {
    console.error(e)
  }
  loading.value = false
})
</script>

<template>
  <DashboardLayout title="Hasil Tes">
    <div class="max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold mb-1">Hasil Skill Test</h1>
    <p class="text-muted-foreground text-sm mb-6">Riwayat dan rincian hasil tes keahlian Anda.</p>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Card class="p-5 flex items-center gap-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <BarChart3 class="h-5 w-5" />
        </div>
        <div>
          <p class="text-2xl font-bold">{{ results.length }}</p>
          <p class="text-xs text-muted-foreground">Total Tes</p>
        </div>
      </Card>
      <Card class="p-5 flex items-center gap-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
          <Target class="h-5 w-5" />
        </div>
        <div>
          <p class="text-2xl font-bold">{{ averageScore }}</p>
          <p class="text-xs text-muted-foreground">Rata-rata Skor</p>
        </div>
      </Card>
      <Card class="p-5 flex items-center gap-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <Medal class="h-5 w-5" />
        </div>
        <div>
          <p class="text-2xl font-bold">{{ results.filter(r => (r.overallScore || 0) >= 70).length }}</p>
          <p class="text-xs text-muted-foreground">Tuntas (&ge;70)</p>
        </div>
      </Card>
    </div>

    <div v-if="loading" class="text-center py-12 text-muted-foreground">Memuat...</div>
    <div v-else-if="results.length === 0" class="text-center py-12 text-muted-foreground">
      <BarChart3 class="h-10 w-10 mx-auto mb-3 opacity-50" />
      <p class="text-sm">Belum ada hasil tes</p>
      <p class="text-xs mt-1">Ikuti skill test untuk melihat hasil di sini</p>
      <Button size="sm" class="mt-4" @click="router.push('/skill-test')">Ikuti Skill Test</Button>
    </div>
    <div v-else class="space-y-3">
      <Card v-for="r in results" :key="r.id" class="p-4">
        <div class="flex items-center justify-between cursor-pointer" @click="toggleExpand(r.id)">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg"
              :class="(r.overallScore || 0) >= 70 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'">
              <Target class="h-5 w-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-lg font-bold" :class="(r.overallScore || 0) >= 70 ? 'text-emerald-600' : 'text-amber-600'">
                  {{ r.overallScore ?? "-" }}
                </span>
                <span class="text-xs text-muted-foreground">{{ r.createdAt?.slice(0, 10) }}</span>
              </div>
              <p v-if="r.recommendedRoles?.length" class="text-xs text-muted-foreground">
                Rekomendasi: {{ r.recommendedRoles.join(", ") }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Badge :variant="(r.overallScore || 0) >= 70 ? 'default' : 'outline'" class="text-[10px]">
              {{ (r.overallScore || 0) >= 70 ? "Tuntas" : "Belum Tuntas" }}
            </Badge>
            <ChevronDown v-if="expanded[r.id]" class="h-4 w-4 text-muted-foreground" />
            <ChevronRight v-else class="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div v-if="expanded[r.id] && r.skillBreakdown" class="mt-4 pt-4 border-t border-border space-y-2">
          <p class="text-xs font-medium text-muted-foreground mb-2">Rincian per Kategori:</p>
          <div v-for="(score, skill) in r.skillBreakdown" :key="skill" class="space-y-1">
            <div class="flex justify-between text-xs">
              <span>{{ skill }}</span>
              <span :class="score >= 70 ? 'text-emerald-600' : 'text-amber-600'">{{ score }}</span>
            </div>
            <div class="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all"
                :class="score >= 70 ? 'bg-emerald-500' : 'bg-amber-500'"
                :style="{ width: score + '%' }"></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
    </div>
  </DashboardLayout>
</template>
