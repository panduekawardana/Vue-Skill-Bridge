<script setup>
import { ref, computed, onMounted } from "vue"
import { useAuthStore } from "@/stores/auth"
import Card from "@/components/ui/Card.vue"
import Badge from "@/components/ui/Badge.vue"
import Button from "@/components/ui/Button.vue"
import { useRouter } from "vue-router"
import { api } from "@/lib/api"
import { Building2, Users, Medal, Plus, Clock, Eye } from "@lucide/vue"

const auth = useAuthStore()
const router = useRouter()

const allNeeds = ref([])
const internships = ref([])
const matches = ref([])
const loading = ref(true)

const umkmProfileId = computed(() => auth.profile?.id)
const openNeeds = computed(() => allNeeds.value.filter(n => n.status === "open" && n.umkmId === umkmProfileId.value))
const activeInternships = computed(() => internships.value.filter(i => i.status === "active"))
const completedInternships = computed(() => internships.value.filter(i => i.status === "completed"))
const pendingMatchCount = computed(() => matches.value.filter(m => m.status === "pending" && m.studentResponse === "accepted").length)

async function load() {
  loading.value = true
  try {
    const [needsRes, internshipsRes, matchesRes] = await Promise.all([
      api.get("/internships/needs"),
      api.get("/internships/list"),
      api.get("/matchmaking"),
    ])
    allNeeds.value = Array.isArray(needsRes) ? needsRes : []
    internships.value = Array.isArray(internshipsRes) ? internshipsRes : []
    matches.value = Array.isArray(matchesRes) ? matchesRes : []
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

const statusColor = {
  open: "default",
  closed: "outline",
  filled: "secondary",
}

onMounted(load)
</script>

<template>
  <div class="space-y-6 max-w-4xl">
    <div>
      <h1 class="text-2xl font-bold">Halo, {{ auth.user?.fullName }}!</h1>
      <p class="text-muted-foreground mt-1">Kelola kebutuhan magang dan kandidat siswa di sini.</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card class="p-5 flex items-center gap-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
          <Building2 class="h-5 w-5" />
        </div>
        <div>
          <p class="text-2xl font-bold">{{ openNeeds.length }}</p>
          <p class="text-xs text-muted-foreground">Kebutuhan Dibuka</p>
        </div>
      </Card>
      <Card class="p-5 flex items-center gap-4 cursor-pointer hover:bg-secondary/20 transition-colors" @click="router.push('/matchmaking')">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <Users class="h-5 w-5" />
        </div>
        <div>
          <p class="text-2xl font-bold">{{ pendingMatchCount }}</p>
          <p class="text-xs text-muted-foreground">Pelamar Baru</p>
        </div>
      </Card>
      <Card class="p-5 flex items-center gap-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
          <Users class="h-5 w-5" />
        </div>
        <div>
          <p class="text-2xl font-bold">{{ activeInternships.length }}</p>
          <p class="text-xs text-muted-foreground">Peserta Magang</p>
        </div>
      </Card>
      <Card class="p-5 flex items-center gap-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <Medal class="h-5 w-5" />
        </div>
        <div>
          <p class="text-2xl font-bold">{{ completedInternships.length }}</p>
          <p class="text-xs text-muted-foreground">Selesai</p>
        </div>
      </Card>
    </div>

    <div class="flex gap-3">
      <Button @click="router.push('/internship-needs/new')">
        <Plus class="h-4 w-4 mr-1.5" />
        Pasang Kebutuhan Baru
      </Button>
      <Button variant="outline" @click="router.push('/matchmaking')">
        <Eye class="h-4 w-4 mr-1.5" />
        Lihat Kandidat
      </Button>
    </div>

    <Card class="p-6">
      <h2 class="font-semibold mb-4">Kebutuhan Magang Saya</h2>
      <div v-if="allNeeds.filter(n => n.umkmId === umkmProfileId).length > 0" class="space-y-3">
        <div
          v-for="n in allNeeds.filter(x => x.umkmId === umkmProfileId)"
          :key="n.id"
          class="flex items-center justify-between border border-border rounded-lg p-3"
        >
          <div class="min-w-0">
            <p class="text-sm font-medium truncate">{{ n.title }}</p>
            <p class="text-xs text-muted-foreground">{{ n.slotFilled }}/{{ n.slotCount }} slot terisi</p>
          </div>
          <Badge :variant="statusColor[n.status] || 'outline'" class="text-[10px] flex-shrink-0">{{ n.status }}</Badge>
        </div>
      </div>
      <div v-else class="text-center py-8 text-muted-foreground">
        <Building2 class="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p class="text-sm">Belum ada kebutuhan magang</p>
        <p class="text-xs mt-1">Pasang kebutuhan baru untuk mulai mencari kandidat</p>
      </div>
    </Card>

    <Card class="p-6">
      <h2 class="font-semibold mb-4">Magang Berjalan</h2>
      <div v-if="activeInternships.length > 0" class="space-y-2">
        <div
          v-for="m in activeInternships"
          :key="m.id"
          class="flex items-center justify-between border border-border rounded-lg p-3 cursor-pointer hover:bg-secondary/20 transition-colors"
          @click="router.push(`/internships/${m.id}`)"
        >
          <div>
            <p class="text-sm font-medium">{{ m.studentName }}</p>
            <p class="text-xs text-muted-foreground">{{ m.studentSchool }} · {{ m.studentMajor }}</p>
          </div>
          <Badge variant="default" class="text-[10px]">{{ m.status }}</Badge>
        </div>
      </div>
      <div v-else class="text-center py-6 text-muted-foreground">
        <Clock class="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p class="text-sm">Belum ada magang berjalan</p>
      </div>
    </Card>
  </div>
</template>
