<script setup>
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import Card from "@/components/ui/Card.vue"
import Badge from "@/components/ui/Badge.vue"
import Button from "@/components/ui/Button.vue"
import { api } from "@/lib/api"
import { Search, Briefcase, MapPin, Users, Clock, Loader2, Check, XCircle, ArrowLeft } from "@lucide/vue"

const router = useRouter()
const auth = useAuthStore()

const needs = ref([])
const myMatches = ref([])
const loading = ref(false)
const search = ref("")
const filterMajor = ref("")
const applyingId = ref(null)
const errorMsg = ref("")

const appliedNeedIds = computed(() => new Set(myMatches.value.map((m) => m.needId)))

const filteredNeeds = computed(() => {
  let result = needs.value.filter(n => n.status === "open")
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(n => n.title?.toLowerCase().includes(q) || n.businessName?.toLowerCase().includes(q))
  }
  if (filterMajor.value) {
    result = result.filter(n => n.requiredMajor === filterMajor.value)
  }
  return result
})

function hasApplied(needId) {
  return appliedNeedIds.value.has(needId)
}

async function loadNeeds() {
  loading.value = true
  try {
    const [needsRes, matchesRes] = await Promise.all([
      api.get("/internships/needs"),
      api.get("/matchmaking"),
    ])
    needs.value = needsRes
    myMatches.value = Array.isArray(matchesRes) ? matchesRes : []
  } catch (e) {
    errorMsg.value = e.message
  }
  loading.value = false
}

async function apply(needId) {
  applyingId.value = needId
  try {
    await api.post(`/matchmaking/apply/${needId}`)
    await loadNeeds()
  } catch (e) {
    errorMsg.value = e.message
  }
  applyingId.value = null
}

onMounted(loadNeeds)
</script>

<template>
  <div class="max-w-4xl mx-auto py-10 px-4">
    <button class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6" @click="router.push('/dashboard')">
      <ArrowLeft class="h-4 w-4" /> Kembali ke Dashboard
    </button>

    <h1 class="text-2xl font-bold mb-1">Cari Kebutuhan Magang</h1>
    <p class="text-muted-foreground text-sm mb-6">Temukan magang mikro yang sesuai dengan jurusan dan minatmu.</p>

    <div v-if="errorMsg" class="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive mb-6">
      {{ errorMsg }}
    </div>

    <div class="flex gap-3 mb-6 flex-wrap">
      <div class="relative flex-1 max-w-xs">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input v-model="search" placeholder="Cari judul atau perusahaan..."
          class="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
      </div>
      <select v-model="filterMajor"
        class="h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50">
        <option value="">Semua Jurusan</option>
        <option value="Rekayasa Perangkat Lunak">RPL</option>
        <option value="Teknik Komputer dan Jaringan">TKJ</option>
        <option value="Multimedia">Multimedia</option>
        <option value="Akuntansi">Akuntansi</option>
        <option value="Administrasi Perkantoran">Administrasi</option>
        <option value="Pemasaran">Pemasaran</option>
      </select>
    </div>

    <div v-if="loading" class="text-center py-12 text-muted-foreground">Memuat...</div>

    <div v-else-if="filteredNeeds.length === 0" class="text-center py-12 text-muted-foreground">
      <Briefcase class="h-10 w-10 mx-auto mb-3 opacity-40" />
      <p class="text-sm">Belum ada kebutuhan magang yang tersedia</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card v-for="n in filteredNeeds" :key="n.id" class="p-5 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 class="font-semibold text-sm">{{ n.title }}</h3>
            <p class="text-xs text-muted-foreground mt-0.5">{{ n.businessName }}</p>
          </div>
          <Badge v-if="n.isVerified" variant="default" class="text-[10px]">Terverifikasi</Badge>
        </div>

        <p class="text-xs text-muted-foreground line-clamp-2 mb-3">{{ n.description || "Tidak ada deskripsi" }}</p>

        <div class="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-3">
          <span class="flex items-center gap-1"><MapPin class="h-3 w-3" />{{ n.city || "—" }}</span>
          <span class="flex items-center gap-1"><Users class="h-3 w-3" />{{ n.slotFilled }}/{{ n.slotCount }} slot</span>
          <span class="flex items-center gap-1"><Clock class="h-3 w-3" />{{ n.durationDays }} hari</span>
        </div>

        <div class="flex flex-wrap gap-1 mb-3">
          <span v-for="s in (Array.isArray(n.requiredSkills) ? n.requiredSkills : [])" :key="s"
            class="text-[10px] bg-secondary px-1.5 py-0.5 rounded">{{ s }}</span>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-border">
          <span class="text-xs font-medium text-primary">{{ n.compensation || "—" }}</span>
          <Button v-if="hasApplied(n.id)" size="sm" variant="secondary" disabled>
            <Check class="h-3.5 w-3.5 mr-1" />Sudah Mendaftar
          </Button>
          <Button v-else size="sm" :disabled="applyingId === n.id" @click="apply(n.id)">
            <Loader2 v-if="applyingId === n.id" class="h-3.5 w-3.5 mr-1 animate-spin" />
            {{ applyingId === n.id ? "Mendaftar..." : "Daftar Minat" }}
          </Button>
        </div>
      </Card>
    </div>
  </div>
</template>
