<script setup>
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import Card from "@/components/ui/Card.vue"
import Button from "@/components/ui/Button.vue"
import Badge from "@/components/ui/Badge.vue"
import { api } from "@/lib/api"
import { ArrowLeft, Check, X, User, School, Briefcase, Zap, Loader2, MessageSquare, Sparkles } from "@lucide/vue"

const router = useRouter()
const auth = useAuthStore()
const matches = ref([])
const loading = ref(false)
const errorMsg = ref("")
const actionLoading = ref(null)
const activeTab = ref("pending")

const isStudent = computed(() => auth.userRole === "student")
const isUmkm = computed(() => auth.userRole === "umkm")

const pendingMatches = computed(() => matches.value.filter(m => m.status === "pending"))
const studentPendingRespond = computed(() =>
  matches.value.filter(m => m.status === "pending" && m.studentResponse === "pending" && m.studentName)
)
const studentAutoRecommendations = computed(() =>
  matches.value.filter(m => m.status === "pending" && m.studentResponse === "pending")
)
const umkmPendingRespond = computed(() =>
  matches.value.filter(m => m.status === "pending" && m.umkmResponse === "pending" && m.businessName)
)
const acceptedMatches = computed(() => matches.value.filter(m => m.status === "accepted"))
const rejectedMatches = computed(() => matches.value.filter(m => m.status === "rejected"))

async function load() {
  loading.value = true
  errorMsg.value = ""
  try {
    const res = await api.get("/matchmaking?status=")
    matches.value = Array.isArray(res) ? res : []
  } catch (e) {
    matches.value = []
    errorMsg.value = e.message
  }
  loading.value = false
}

async function respond(matchId, response) {
  actionLoading.value = matchId
  errorMsg.value = ""
  try {
    await api.post(`/matchmaking/${matchId}/respond`, { response })
    await load()
  } catch (e) {
    errorMsg.value = e.message
  }
  actionLoading.value = null
}

function formatSkills(skills) {
  if (!skills) return []
  if (Array.isArray(skills)) return skills
  try { return JSON.parse(skills) } catch { return [] }
}

onMounted(load)
</script>

<template>
  <div class="max-w-4xl mx-auto py-10 px-4">
    <button class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6" @click="router.push('/dashboard')">
      <ArrowLeft class="h-4 w-4" /> Kembali ke Dashboard
    </button>

    <h1 class="text-2xl font-bold mb-1">{{ isUmkm ? "Kandidat Pelamar" : "Status Lamaran" }}</h1>
    <p class="text-muted-foreground text-sm mb-6">
      {{ isUmkm ? "Lihat dan kelola siswa yang mendaftar ke kebutuhan magang Anda." : "Pantau status lamaran magang Anda." }}
    </p>

    <div v-if="errorMsg" class="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive mb-6">
      {{ errorMsg }}
    </div>

    <!-- ─── STUDENT VIEW ─── -->
    <template v-if="isStudent">
      <!-- Auto-recommendations: pending where student hasn't responded yet -->
      <div class="mb-8">
        <div class="flex items-center gap-2 mb-3">
          <Sparkles class="h-4 w-4 text-primary" />
          <h2 class="font-semibold text-sm">Rekomendasi Untukmu</h2>
          <Badge v-if="studentAutoRecommendations.length > 0" variant="default" class="text-[10px]">{{ studentAutoRecommendations.length }}</Badge>
        </div>

        <div v-if="studentAutoRecommendations.length === 0 && !loading" class="text-center py-8 bg-secondary/20 rounded-lg">
          <Sparkles class="h-8 w-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
          <p class="text-sm text-muted-foreground">Belum ada rekomendasi. Ikuti skill test untuk mendapatkan rekomendasi.</p>
        </div>

        <div v-for="m in studentAutoRecommendations" :key="m.id" class="border border-border rounded-lg p-4 mb-3 bg-white">
          <div class="flex items-start gap-4">
            <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
              <Briefcase class="h-5 w-5" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-semibold text-sm">{{ m.needTitle }}</h3>
                <Badge variant="outline" class="text-[10px]">Skor {{ m.matchScore || "—" }}</Badge>
              </div>
              <p class="text-xs text-muted-foreground mb-1">{{ m.businessName }}</p>
              <div v-if="m.matchDetails" class="text-[10px] text-muted-foreground mb-3 space-y-1">
                <div class="flex flex-wrap gap-x-3 gap-y-0.5">
                  <span>Skill: {{ m.matchDetails.skillMatch || 0 }}%</span>
                  <span>Jurusan: {{ m.matchDetails.majorMatch || 0 }}%</span>
                  <span>Nilai Tes: {{ m.matchDetails.testPerformance || 0 }}%</span>
                  <span>Role: {{ m.matchDetails.roleFit || 0 }}%</span>
                  <span>Lokasi: {{ m.matchDetails.locationMatch || 0 }}%</span>
                </div>
                <div class="w-full h-1 bg-secondary rounded-full overflow-hidden mt-1">
                  <div class="h-full bg-primary rounded-full transition-all" :style="{ width: (m.matchScore || 0) + '%' }" />
                </div>
              </div>
              <div class="flex gap-2">
                <Button size="sm" :disabled="actionLoading === m.id" @click="respond(m.id, 'accepted')">
                  <Check v-if="actionLoading !== m.id" class="h-3.5 w-3.5 mr-1" />
                  <Loader2 v-else class="h-3.5 w-3.5 mr-1 animate-spin" />
                  Terima
                </Button>
                <Button size="sm" variant="destructive" :disabled="actionLoading === m.id" @click="respond(m.id, 'rejected')">
                  <X class="h-3.5 w-3.5 mr-1" />Tolak
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Accepted & Rejected for student -->
      <div class="mb-6" v-if="acceptedMatches.length > 0">
        <div class="flex items-center gap-2 mb-3">
          <h2 class="font-semibold text-sm">Diterima</h2>
          <Badge variant="secondary" class="text-[10px]">{{ acceptedMatches.length }}</Badge>
        </div>
        <div v-for="m in acceptedMatches" :key="m.id" class="border border-border rounded-lg p-3 mb-2 bg-white flex items-center gap-3">
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">
            <Briefcase class="h-4 w-4" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">{{ m.needTitle }}</p>
            <p class="text-xs text-muted-foreground">{{ m.businessName }}</p>
          </div>
          <Badge variant="secondary" class="text-[10px]">Match</Badge>
        </div>
      </div>

      <div v-if="rejectedMatches.length > 0">
        <div class="flex items-center gap-2 mb-3">
          <h2 class="font-semibold text-sm">Ditolak</h2>
          <Badge variant="outline" class="text-[10px]">{{ rejectedMatches.length }}</Badge>
        </div>
        <div v-for="m in rejectedMatches" :key="m.id" class="border border-border rounded-lg p-3 mb-2 bg-white flex items-center gap-3 opacity-60">
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold">
            <Briefcase class="h-4 w-4" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">{{ m.needTitle }}</p>
            <p class="text-xs text-muted-foreground">{{ m.businessName }}</p>
          </div>
          <Badge variant="outline" class="text-[10px]">Ditolak</Badge>
        </div>
      </div>
    </template>

    <!-- ─── UMKM VIEW ─── -->
    <template v-if="isUmkm">
      <!-- Pending -->
      <div class="mb-8">
        <div class="flex items-center gap-2 mb-3">
          <h2 class="font-semibold text-sm">Menunggu Respon</h2>
          <Badge v-if="umkmPendingRespond.length > 0" variant="default" class="text-[10px]">{{ umkmPendingRespond.length }}</Badge>
        </div>

        <div v-if="umkmPendingRespond.length === 0 && !loading" class="text-center py-8 bg-secondary/20 rounded-lg">
          <User class="h-8 w-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
          <p class="text-sm text-muted-foreground">Belum ada pelamar yang perlu direspon</p>
        </div>

        <div v-for="m in umkmPendingRespond" :key="m.id" class="border border-border rounded-lg p-4 mb-3 bg-white">
          <div class="flex items-start gap-4">
            <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-sm font-bold">
              {{ m.studentName?.charAt(0) || "?" }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-semibold text-sm">{{ m.studentName }}</h3>
                <Badge variant="outline" class="text-[10px]">Skor {{ m.matchScore || "—" }}</Badge>
              </div>
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                <span class="flex items-center gap-1"><School class="h-3 w-3" /> {{ m.studentSchool }} · {{ m.studentMajor }}</span>
              </div>
              <div v-if="m.matchDetails" class="text-[10px] text-muted-foreground mb-2 space-y-1">
                <div class="flex flex-wrap gap-x-3 gap-y-0.5">
                  <span>Skill: {{ m.matchDetails.skillMatch || 0 }}%</span>
                  <span>Jurusan: {{ m.matchDetails.majorMatch || 0 }}%</span>
                  <span>Nilai Tes: {{ m.matchDetails.testPerformance || 0 }}%</span>
                  <span>Lokasi: {{ m.matchDetails.locationMatch || 0 }}%</span>
                </div>
                <div class="w-full h-1 bg-secondary rounded-full overflow-hidden">
                  <div class="h-full bg-primary rounded-full transition-all" :style="{ width: (m.matchScore || 0) + '%' }" />
                </div>
              </div>
              <p class="text-xs text-muted-foreground mb-2">
                Melamar untuk: <span class="font-medium text-foreground">{{ m.needTitle }}</span>
              </p>
              <div v-if="m.studentSkills" class="flex flex-wrap gap-1 mb-3">
                <span v-for="s in formatSkills(m.studentSkills)" :key="s" class="text-[10px] bg-secondary px-1.5 py-0.5 rounded">{{ s }}</span>
              </div>
              <div class="flex gap-2">
                <Button size="sm" :disabled="actionLoading === m.id" @click="respond(m.id, 'accepted')">
                  <Check v-if="actionLoading !== m.id" class="h-3.5 w-3.5 mr-1" />
                  <Loader2 v-else class="h-3.5 w-3.5 mr-1 animate-spin" />
                  Terima
                </Button>
                <Button size="sm" variant="destructive" :disabled="actionLoading === m.id" @click="respond(m.id, 'rejected')">
                  <X class="h-3.5 w-3.5 mr-1" />Tolak
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Accepted -->
      <div class="mb-8">
        <div class="flex items-center gap-2 mb-3">
          <h2 class="font-semibold text-sm">Diterima</h2>
          <Badge v-if="acceptedMatches.length > 0" variant="secondary" class="text-[10px]">{{ acceptedMatches.length }}</Badge>
        </div>
        <div v-if="acceptedMatches.length === 0" class="text-center py-6 bg-secondary/20 rounded-lg">
          <p class="text-xs text-muted-foreground">Belum ada kandidat yang diterima</p>
        </div>
        <div v-for="m in acceptedMatches" :key="m.id" class="border border-border rounded-lg p-3 mb-2 bg-white flex items-center gap-3">
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">
            {{ m.studentName?.charAt(0) || "?" }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">{{ m.studentName }}</p>
            <p class="text-xs text-muted-foreground">{{ m.needTitle }} · {{ m.studentSchool }}</p>
          </div>
          <Badge variant="secondary" class="text-[10px]">Match</Badge>
        </div>
      </div>

      <!-- Rejected -->
      <div>
        <div class="flex items-center gap-2 mb-3">
          <h2 class="font-semibold text-sm">Ditolak</h2>
          <Badge v-if="rejectedMatches.length > 0" variant="outline" class="text-[10px]">{{ rejectedMatches.length }}</Badge>
        </div>
        <div v-if="rejectedMatches.length === 0" class="text-center py-6 bg-secondary/20 rounded-lg">
          <p class="text-xs text-muted-foreground">Belum ada kandidat yang ditolak</p>
        </div>
        <div v-for="m in rejectedMatches" :key="m.id" class="border border-border rounded-lg p-3 mb-2 bg-white flex items-center gap-3 opacity-60">
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold">
            {{ m.studentName?.charAt(0) || "?" }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">{{ m.studentName }}</p>
            <p class="text-xs text-muted-foreground">{{ m.needTitle }}</p>
          </div>
          <Badge variant="outline" class="text-[10px]">Ditolak</Badge>
        </div>
      </div>
    </template>
  </div>
</template>
