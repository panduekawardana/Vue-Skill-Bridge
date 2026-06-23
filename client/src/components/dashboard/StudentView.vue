<script setup>
import { ref, computed, onMounted } from "vue"
import { useAuthStore } from "@/stores/auth"
import Card from "@/components/ui/Card.vue"
import Badge from "@/components/ui/Badge.vue"
import Button from "@/components/ui/Button.vue"
import { useRouter } from "vue-router"
import { api } from "@/lib/api"
import { ClipboardCheck, Zap, Medal, ArrowRight, Clock, FileText, Briefcase, Search } from "@lucide/vue"

const auth = useAuthStore()
const router = useRouter()

const internships = ref([])
const matches = ref([])
const certificates = ref([])
const skillResults = ref([])
const loading = ref(true)

const activeInternships = computed(() => internships.value.filter(i => i.status === "active"))
const completedInternships = computed(() => internships.value.filter(i => i.status === "completed"))

async function load() {
  loading.value = true
  try {
    const [internshipsRes, matchesRes, certsRes, resultsRes] = await Promise.all([
      api.get("/internships/list"),
      api.get("/matchmaking"),
      api.get("/certificates"),
      api.get("/skill-test/results"),
    ])
    internships.value = Array.isArray(internshipsRes) ? internshipsRes : []
    matches.value = Array.isArray(matchesRes) ? matchesRes : []
    certificates.value = Array.isArray(certsRes) ? certsRes : []
    skillResults.value = Array.isArray(resultsRes) ? resultsRes : []
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

const statusColor = {
  scheduled: "outline",
  active: "default",
  completed: "secondary",
  cancelled: "destructive",
}

onMounted(load)
</script>

<template>
  <div class="space-y-6 max-w-4xl">
    <div>
      <h1 class="text-2xl font-bold">Halo, {{ auth.user?.fullName }}!</h1>
      <p class="text-muted-foreground mt-1">Selamat datang di dashboard siswa. Kelola aktivitas magangmu di sini.</p>
      <div class="flex gap-2 mt-3 flex-wrap">
        <Button size="sm" variant="outline" @click="router.push('/internship-needs/browse')">
          <Search class="h-4 w-4 mr-1.5" /> Cari Kebutuhan Magang
        </Button>
        <Button size="sm" @click="router.push('/skill-test')">
          <FileText class="h-4 w-4 mr-1.5" /> Ikuti Skill Test
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card class="p-5 flex items-center gap-4 cursor-pointer hover:bg-secondary/20 transition-colors" @click="router.push('/skill-test')">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <ClipboardCheck class="h-5 w-5" />
        </div>
        <div>
          <p class="text-2xl font-bold">{{ skillResults.length }}</p>
          <p class="text-xs text-muted-foreground">Skill Test</p>
        </div>
      </Card>
      <Card class="p-5 flex items-center gap-4 cursor-pointer hover:bg-secondary/20 transition-colors" @click="router.push('/matchmaking')">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
          <Zap class="h-5 w-5" />
        </div>
        <div>
          <p class="text-2xl font-bold">{{ matches.filter(m => m.status === "pending").length }}</p>
          <p class="text-xs text-muted-foreground">Match Rekomendasi</p>
        </div>
      </Card>
      <Card class="p-5 flex items-center gap-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
          <Medal class="h-5 w-5" />
        </div>
        <div>
          <p class="text-2xl font-bold">{{ certificates.length }}</p>
          <p class="text-xs text-muted-foreground">Sertifikat</p>
        </div>
      </Card>
    </div>

    <Card class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold">Magang Aktif</h2>
        <Badge v-if="activeInternships.length > 0">{{ activeInternships.length }}</Badge>
      </div>
      <div v-if="activeInternships.length > 0" class="space-y-3">
        <div
          v-for="m in activeInternships"
          :key="m.id"
          class="flex items-center justify-between border border-border rounded-lg p-3 cursor-pointer hover:bg-secondary/20 transition-colors"
          @click="router.push(`/internships/${m.id}`)"
        >
          <div>
            <p class="text-sm font-medium">{{ m.businessName }}</p>
            <p class="text-xs text-muted-foreground">{{ m.startDate?.slice(0, 10) }} — {{ m.endDate?.slice(0, 10) }}</p>
          </div>
          <Badge variant="default" class="text-[10px]">{{ m.status }}</Badge>
        </div>
      </div>
      <div v-else class="text-center py-8 text-muted-foreground">
        <Search class="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p class="text-sm">Belum ada magang aktif</p>
        <p class="text-xs mt-1">Cari kebutuhan magang yang tersedia atau ikuti skill test untuk rekomendasi</p>
        <div class="flex gap-2 justify-center mt-4">
          <Button size="sm" variant="outline" @click="router.push('/internship-needs/browse')">
            <Search class="h-4 w-4 mr-1.5" />Cari Magang
          </Button>
          <Button size="sm" @click="router.push('/skill-test')">
            <FileText class="h-4 w-4 mr-1.5" />Ikuti Skill Test
          </Button>
        </div>
      </div>
    </Card>

    <Card class="p-6">
      <h2 class="font-semibold mb-4">Riwayat Magang</h2>
      <div v-if="internships.length > 0" class="space-y-2">
        <div
          v-for="m in internships"
          :key="m.id"
          class="flex items-center justify-between border border-border rounded-lg p-3 cursor-pointer hover:bg-secondary/20 transition-colors"
          @click="router.push(`/internships/${m.id}`)"
        >
          <div>
            <p class="text-sm font-medium">{{ m.businessName }}</p>
            <p class="text-xs text-muted-foreground">{{ m.startDate?.slice(0, 10) }}</p>
          </div>
          <Badge :variant="statusColor[m.status] || 'outline'" class="text-[10px]">{{ m.status }}</Badge>
        </div>
      </div>
      <div v-else class="text-center py-6 text-muted-foreground">
        <p class="text-sm">Belum ada riwayat magang</p>
      </div>
    </Card>

    <Card class="p-6">
      <h2 class="font-semibold mb-4">Sertifikat Saya</h2>
      <div v-if="certificates.length > 0" class="space-y-2">
        <div
          v-for="c in certificates"
          :key="c.id"
          class="flex items-center justify-between border border-border rounded-lg p-3"
        >
          <div>
            <p class="text-sm font-medium">{{ c.certificateNumber }}</p>
            <p class="text-xs text-muted-foreground">{{ c.studentSchool }} · {{ c.studentMajor }}</p>
          </div>
          <Badge variant="secondary" class="text-[10px]">{{ c.issuedAt?.slice(0, 10) }}</Badge>
        </div>
      </div>
      <div v-else class="text-center py-6 text-muted-foreground">
        <Medal class="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p class="text-sm">Belum ada sertifikat</p>
      </div>
    </Card>
  </div>
</template>
