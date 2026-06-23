<script setup>
import { ref, computed, onMounted } from "vue"
import { useRouter, useRoute } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import Card from "@/components/ui/Card.vue"
import Badge from "@/components/ui/Badge.vue"
import Button from "@/components/ui/Button.vue"
import { api } from "@/lib/api"
import {
  ArrowLeft, Calendar, Clock, CheckCircle, XCircle, FileText,
  MessageSquare, Star, Loader2, Send, Medal, User, Building2,
} from "@lucide/vue"

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const internship = ref(null)
const evaluations = ref([])
const certificates = ref([])
const loading = ref(true)
const errorMsg = ref("")

const logForm = ref({ content: "" })
const logSaving = ref(false)
const statusUpdating = ref(false)

const isStudent = computed(() => auth.userRole === "student")
const isUmkm = computed(() => auth.userRole === "umkm")
const isMyInternship = computed(() => {
  if (!internship.value) return false
  if (isStudent.value) return true
  if (isUmkm.value) return true
  return false
})

const dailyLogs = computed(() => {
  const logs = internship.value?.dailyLog
  if (!logs) return []
  if (Array.isArray(logs)) return logs
  return []
})

const myEvaluation = computed(() => {
  const role = isStudent.value ? "student" : "umkm"
  return evaluations.value.find(e => e.evaluatorRole === role)
})

const otherEvaluation = computed(() => {
  const role = isStudent.value ? "umkm" : "student"
  return evaluations.value.find(e => e.evaluatorRole === role)
})

const certificate = computed(() => certificates.value[0] || null)

const statusColor = { scheduled: "outline", active: "default", completed: "secondary", cancelled: "destructive" }

async function load() {
  loading.value = true
  errorMsg.value = ""
  try {
    const id = route.params.id
    const [internshipRes, evalsRes, certsRes] = await Promise.all([
      api.get(`/internships/list/${id}`),
      api.get("/evaluations"),
      api.get("/certificates"),
    ])
    internship.value = internshipRes
    evaluations.value = Array.isArray(evalsRes) ? evalsRes : []
    certificates.value = Array.isArray(certsRes) ? certsRes.filter(c => c.internshipId === id) : []
  } catch (e) {
    errorMsg.value = e.message
  }
  loading.value = false
}

async function addLog() {
  if (!logForm.value.content.trim()) return
  logSaving.value = true
  try {
    await api.post(`/internships/list/${route.params.id}/daily-log`, { content: logForm.value.content })
    logForm.value.content = ""
    await load()
  } catch (e) {
    errorMsg.value = e.message
  }
  logSaving.value = false
}

async function updateStatus(newStatus) {
  statusUpdating.value = true
  errorMsg.value = ""
  try {
    await api.patch(`/internships/list/${route.params.id}/status`, { status: newStatus })
    await load()
  } catch (e) {
    errorMsg.value = e.message
  }
  statusUpdating.value = false
}

const nextStatus = computed(() => {
  if (!internship.value) return null
  const map = { scheduled: "active", active: "completed" }
  return map[internship.value.status] || null
})

const nextStatusLabel = computed(() => {
  const map = { active: "Mulai Magang", completed: "Selesaikan Magang" }
  return map[nextStatus.value] || null
})

function formatDate(d) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

function formatTime(d) {
  if (!d) return ""
  return new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
}

onMounted(load)
</script>

<template>
  <div class="max-w-3xl mx-auto py-10 px-4">
    <button class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6" @click="router.push('/dashboard')">
      <ArrowLeft class="h-4 w-4" /> Kembali ke Dashboard
    </button>

    <div v-if="loading" class="text-center py-16 text-muted-foreground">Memuat...</div>

    <div v-else-if="errorMsg" class="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
      {{ errorMsg }}
    </div>

    <template v-else-if="internship">
      <!-- Header -->
      <Card class="p-6 mb-6">
        <div class="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 class="text-xl font-bold">
              {{ isStudent ? internship.businessName : internship.studentName }}
            </h1>
            <p class="text-xs text-muted-foreground mt-0.5">
              {{ isStudent ? internship.businessType : `${internship.studentSchool} · ${internship.studentMajor}` }}
            </p>
          </div>
          <Badge :variant="statusColor[internship.status] || 'outline'" class="text-[10px]">
            {{ internship.status === "scheduled" ? "Terjadwal" : internship.status === "active" ? "Berjalan" : internship.status === "completed" ? "Selesai" : "Dibatalkan" }}
          </Badge>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div class="bg-secondary/20 rounded-lg p-3">
            <p class="text-muted-foreground mb-0.5">Mulai</p>
            <p class="font-medium">{{ formatDate(internship.startDate) }}</p>
          </div>
          <div class="bg-secondary/20 rounded-lg p-3">
            <p class="text-muted-foreground mb-0.5">Selesai</p>
            <p class="font-medium">{{ formatDate(internship.endDate) }}</p>
          </div>
          <div class="bg-secondary/20 rounded-lg p-3">
            <p class="text-muted-foreground mb-0.5">Durasi</p>
            <p class="font-medium">{{ Math.round((new Date(internship.endDate) - new Date(internship.startDate)) / (1000*60*60*24)) }} hari</p>
          </div>
          <div class="bg-secondary/20 rounded-lg p-3">
            <p class="text-muted-foreground mb-0.5">Log</p>
            <p class="font-medium">{{ dailyLogs.length }} entri</p>
          </div>
        </div>

        <!-- Actions -->
        <div v-if="isUmkm && nextStatus" class="mt-4 pt-4 border-t border-border">
          <Button :disabled="statusUpdating" @click="updateStatus(nextStatus)">
            <Loader2 v-if="statusUpdating" class="h-4 w-4 mr-1.5 animate-spin" />
            <CheckCircle v-else class="h-4 w-4 mr-1.5" />{{ nextStatusLabel }}
          </Button>
        </div>
      </Card>

      <!-- Certificate (if completed) -->
      <Card v-if="certificate" class="p-5 mb-6 border-emerald-200 bg-emerald-50/30">
        <div class="flex items-center gap-3">
          <Medal class="h-8 w-8 text-emerald-600 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-sm">Sertifikat Diterbitkan</h3>
            <p class="text-xs text-muted-foreground">{{ certificate.certificateNumber }} · {{ formatDate(certificate.issuedAt) }}</p>
          </div>
        </div>
      </Card>

      <!-- Evaluations -->
      <Card v-if="internship.status === 'completed'" class="p-5 mb-6">
        <h2 class="font-semibold text-sm mb-3">Ulasan</h2>

        <div v-if="!myEvaluation" class="mb-3">
          <Button size="sm" variant="outline" @click="router.push(`/internships/${internship.id}/evaluate`)">
            <Star class="h-3.5 w-3.5 mr-1" />Beri Ulasan
          </Button>
        </div>
        <div v-else class="bg-secondary/20 rounded-lg p-3 mb-2">
          <div class="flex items-center gap-1 mb-1">
            <span class="text-xs font-medium">Ulasan Anda:</span>
            <span class="text-amber-500 text-xs">{{ "★".repeat(myEvaluation.rating) }}{{ "☆".repeat(5 - myEvaluation.rating) }}</span>
          </div>
          <p v-if="myEvaluation.reviewText" class="text-xs text-muted-foreground">{{ myEvaluation.reviewText }}</p>
        </div>

        <div v-if="otherEvaluation" class="bg-secondary/20 rounded-lg p-3">
          <div class="flex items-center gap-1 mb-1">
            <span class="text-xs font-medium">Ulasan {{ otherEvaluation.evaluatorRole === "umkm" ? "UMKM" : "Siswa" }}:</span>
            <span class="text-amber-500 text-xs">{{ "★".repeat(otherEvaluation.rating) }}{{ "☆".repeat(5 - otherEvaluation.rating) }}</span>
          </div>
          <p v-if="otherEvaluation.reviewText" class="text-xs text-muted-foreground">{{ otherEvaluation.reviewText }}</p>
        </div>

        <p v-if="!myEvaluation && !otherEvaluation" class="text-xs text-muted-foreground">Belum ada ulasan.</p>
      </Card>

      <!-- Daily Log -->
      <Card class="p-6">
        <h2 class="font-semibold text-sm mb-4">Daily Log</h2>

        <!-- Add log (student only, active status) -->
        <div v-if="isStudent && internship.status === 'active'" class="flex gap-2 mb-4">
          <input v-model="logForm.content" placeholder="Catat aktivitas hari ini..." class="flex-1 h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            @keydown.enter.prevent="addLog" />
          <Button size="sm" :disabled="logSaving || !logForm.content.trim()" @click="addLog">
            <Send v-if="!logSaving" class="h-4 w-4" />
            <Loader2 v-else class="h-4 w-4 animate-spin" />
          </Button>
        </div>

        <div v-if="dailyLogs.length === 0" class="text-center py-6 text-muted-foreground">
          <FileText class="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p class="text-xs">Belum ada catatan harian</p>
        </div>

        <div v-else class="space-y-2">
          <div v-for="log in [...dailyLogs].reverse()" :key="log.id" class="border border-border rounded-lg p-3">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-medium">{{ formatDate(log.date) }}</span>
              <span class="text-[10px] text-muted-foreground">{{ formatTime(log.createdAt) }}</span>
            </div>
            <p class="text-sm">{{ log.content }}</p>
          </div>
        </div>
      </Card>
    </template>
  </div>
</template>
