<script setup>
import { ref, onMounted } from "vue"
import Card from "@/components/ui/Card.vue"
import Badge from "@/components/ui/Badge.vue"
import Button from "@/components/ui/Button.vue"
import { api } from "@/lib/api"
import { Shuffle, Loader2, CheckCircle, XCircle, AlertCircle } from "@lucide/vue"

const matches = ref([])
const loading = ref(false)
const actionLoading = ref(null)
const errorMsg = ref("")
const successMsg = ref("")

async function load() {
  loading.value = true
  errorMsg.value = ""
  try {
    const res = await api.get("/matchmaking")
    matches.value = Array.isArray(res) ? res : []
  } catch (e) {
    errorMsg.value = e.message || "Gagal memuat data"
  }
  loading.value = false
}

async function forceAccept(match) {
  actionLoading.value = match.id
  errorMsg.value = ""
  successMsg.value = ""
  try {
    await api.post(`/matchmaking/${match.id}/respond`, { response: "accepted" })
    successMsg.value = `Match ${match.studentName} → ${match.needTitle} berhasil di-accept`
    await load()
  } catch (e) {
    errorMsg.value = e.message || "Gagal force accept"
  }
  actionLoading.value = null
}

async function forceReject(match) {
  actionLoading.value = match.id
  errorMsg.value = ""
  successMsg.value = ""
  try {
    await api.post(`/matchmaking/${match.id}/respond`, { response: "rejected" })
    successMsg.value = `Match ${match.studentName} → ${match.needTitle} berhasil ditolak`
    await load()
  } catch (e) {
    errorMsg.value = e.message || "Gagal force reject"
  }
  actionLoading.value = null
}

const statusColor = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-700",
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Match Override</h1>
      <p class="text-muted-foreground mt-1">Force accept/reject match antar siswa dan UMKM.</p>
    </div>

    <div v-if="errorMsg" class="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
      <XCircle class="h-4 w-4" /> {{ errorMsg }}
    </div>

    <div v-if="successMsg" class="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
      <CheckCircle class="h-4 w-4" /> {{ successMsg }}
    </div>

    <div v-if="loading" class="text-center py-12 text-muted-foreground">
      <Loader2 class="h-6 w-6 mx-auto mb-2 animate-spin" />
      Memuat...
    </div>

    <div v-else class="space-y-3">
      <Card v-for="m in matches" :key="m.id" class="p-4">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <Badge :class="statusColor[m.status] || 'bg-gray-100 text-gray-700'" class="text-[10px]">
                {{ m.status }}
              </Badge>
              <span class="text-xs text-muted-foreground">Score: {{ m.matchScore || "—" }}</span>
              <span v-if="m.studentResponse === 'accepted'" class="text-[10px] text-emerald-600">Siswa ✅</span>
              <span v-if="m.studentResponse === 'rejected'" class="text-[10px] text-red-600">Siswa ❌</span>
              <span v-if="m.umkmResponse === 'accepted'" class="text-[10px] text-emerald-600">UMKM ✅</span>
              <span v-if="m.umkmResponse === 'rejected'" class="text-[10px] text-red-600">UMKM ❌</span>
            </div>
            <p class="text-sm font-medium truncate">{{ m.studentName || "—" }} → {{ m.needTitle || "—" }}</p>
            <p class="text-xs text-muted-foreground">{{ m.businessName || "—" }}</p>
            <div v-if="m.matchDetails" class="flex flex-wrap gap-2 mt-1 text-[10px] text-muted-foreground">
              <span>Skill: {{ m.matchDetails.skillMatch || 0 }}%</span>
              <span>Jurusan: {{ m.matchDetails.majorMatch || 0 }}%</span>
              <span>Nilai: {{ m.matchDetails.testPerformance || 0 }}%</span>
              <span>Role: {{ m.matchDetails.roleFit || 0 }}%</span>
              <span>Lokasi: {{ m.matchDetails.locationMatch || 0 }}%</span>
            </div>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <Button
              v-if="m.status === 'pending'"
              size="sm"
              :disabled="actionLoading === m.id"
              @click="forceAccept(m)"
            >
              <Loader2 v-if="actionLoading === m.id" class="h-3.5 w-3.5 mr-1 animate-spin" />
              <CheckCircle v-else class="h-3.5 w-3.5 mr-1" />
              Accept
            </Button>
            <Button
              v-if="m.status === 'pending'"
              variant="destructive"
              size="sm"
              :disabled="actionLoading === m.id"
              @click="forceReject(m)"
            >
              <XCircle class="h-3.5 w-3.5 mr-1" />Tolak
            </Button>
          </div>
        </div>
      </Card>
      <p v-if="!loading && matches.length === 0" class="text-center text-muted-foreground py-12">
        <Shuffle class="h-8 w-8 mx-auto mb-2 opacity-30" />
        Belum ada match
      </p>
    </div>
  </div>
</template>
