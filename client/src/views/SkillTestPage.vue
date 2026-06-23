<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRouter, useRoute } from "vue-router"
import Card from "@/components/ui/Card.vue"
import Button from "@/components/ui/Button.vue"
import Badge from "@/components/ui/Badge.vue"
import { api } from "@/lib/api"
import { Clock, Loader2, AlertTriangle, ChevronLeft, ChevronRight, Check, FileText, ArrowLeft } from "@lucide/vue"

const router = useRouter()
const route = useRoute()

const state = ref("idle") // idle | taking | submitting | done | error
const attemptId = ref(null)
const questions = ref([])
const answers = ref({})
const currentIndex = ref(0)
const timeLimit = ref(15) // minutes
const timeRemaining = ref(0)
const result = ref(null)
const errorMsg = ref("")
const loading = ref(false)
const showConfirm = ref(false)
const activeAttemptId = route.params.id || null

let timerInterval = null

const currentQuestion = computed(() => questions.value[currentIndex.value] || null)
const totalQuestions = computed(() => questions.value.length)
const answeredCount = computed(() => Object.keys(answers.value).length)
const progressPercent = computed(() => totalQuestions.value > 0 ? Math.round((answeredCount.value / totalQuestions.value) * 100) : 0)

const formattedTime = computed(() => {
  const m = Math.floor(timeRemaining.value / 60)
  const s = timeRemaining.value % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
})

const timeWarning = computed(() => timeRemaining.value <= 120)

function startTimer() {
  timeRemaining.value = timeLimit.value * 60
  timerInterval = setInterval(() => {
    timeRemaining.value--
    if (timeRemaining.value <= 0) {
      clearInterval(timerInterval)
      submitAnswers()
    }
  }, 1000)
}

async function startTest() {
  loading.value = true
  errorMsg.value = ""
  try {
    const res = await api.post("/skill-test/attempts")
    attemptId.value = res.attemptId
    questions.value = res.questions || []
    timeLimit.value = res.timeLimit || 15
    answers.value = {}
    currentIndex.value = 0
    state.value = "taking"
    startTimer()
  } catch (e) {
    errorMsg.value = e.message
    state.value = "idle"
  }
  loading.value = false
}

function selectAnswer(questionId, value) {
  answers.value[questionId] = value
}

function goTo(idx) {
  if (idx >= 0 && idx < totalQuestions.value) {
    currentIndex.value = idx
  }
}

function confirmSubmit() {
  showConfirm.value = true
}

async function submitAnswers() {
  if (timerInterval) clearInterval(timerInterval)
  state.value = "submitting"
  errorMsg.value = ""
  try {
    const payload = {
      answers: Object.entries(answers.value).map(([questionId, answerText]) => ({
        questionId,
        answerText: String(answerText),
      })),
    }
    const res = await api.post(`/skill-test/attempts/${attemptId.value}/submit`, payload)
    result.value = { score: res.score, total: questions.value.length, answered: Object.keys(answers.value).length }
    state.value = "done"
  } catch (e) {
    errorMsg.value = e.message
    state.value = "taking"
  }
}

function formatQuestionType(type) {
  const map = { multiple_choice: "Pilihan Ganda", essay: "Essay", coding: "Coding" }
  return map[type] || type
}

// Anti-cheat: prevent copy/context menu
function preventCheat(e) {
  if (e.type === "copy" || e.type === "cut") {
    e.preventDefault()
  }
}

onMounted(() => {
  if (activeAttemptId) {
    // Resume or just show — for now treat as new
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<template>
  <div class="min-h-screen bg-secondary/20">
    <!-- IDLE STATE: Start screen -->
    <div v-if="state === 'idle'" class="max-w-xl mx-auto py-16 px-4">
      <button class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6" @click="router.push('/dashboard')">
        <ArrowLeft class="h-4 w-4" /> Kembali ke Dashboard
      </button>

      <Card class="p-8 text-center">
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mx-auto mb-5">
          <FileText class="h-8 w-8" />
        </div>
        <h1 class="text-2xl font-bold mb-2">Skill Test</h1>
        <p class="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          Uji kompetensimu dengan tes adaptif. Hasil tes akan digunakan untuk mencocokkan dengan kebutuhan magang yang sesuai.
        </p>

        <div class="grid grid-cols-3 gap-4 mb-6 text-center">
          <div class="bg-secondary/30 rounded-lg p-3">
            <p class="text-lg font-bold text-primary">20</p>
            <p class="text-[10px] text-muted-foreground">Soal</p>
          </div>
          <div class="bg-secondary/30 rounded-lg p-3">
            <p class="text-lg font-bold text-primary">15</p>
            <p class="text-[10px] text-muted-foreground">Menit</p>
          </div>
          <div class="bg-secondary/30 rounded-lg p-3">
            <p class="text-lg font-bold text-primary">Acak</p>
            <p class="text-[10px] text-muted-foreground">Soal</p>
          </div>
        </div>

        <div v-if="errorMsg" class="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive mb-4">
          {{ errorMsg }}
        </div>

        <Button class="w-full" :disabled="loading" @click="startTest">
          <Loader2 v-if="loading" class="h-4 w-4 mr-2 animate-spin" />
          {{ loading ? "Menyiapkan soal..." : "Mulai Tes" }}
        </Button>

        <p class="text-[10px] text-muted-foreground mt-3">
          Pastikan koneksi stabil. Tes tidak bisa diulang jika sudah dimulai.
        </p>
      </Card>
    </div>

    <!-- TAKING STATE: Active test -->
    <div v-if="state === 'taking' || state === 'submitting'" class="max-w-3xl mx-auto py-6 px-4">
      <!-- Top bar: timer + progress -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <Clock :class="['h-4 w-4', timeWarning ? 'text-destructive animate-pulse' : 'text-muted-foreground']" />
          <span :class="['font-mono text-sm font-bold', timeWarning ? 'text-destructive' : 'text-foreground']">
            {{ formattedTime }}
          </span>
        </div>
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{{ currentIndex + 1 }}/{{ totalQuestions }}</span>
          <span class="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
            <span class="block h-full bg-primary rounded-full transition-all" :style="{ width: progressPercent + '%' }" />
          </span>
        </div>
      </div>

      <div v-if="errorMsg" class="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive mb-4">
        {{ errorMsg }}
      </div>

      <!-- Question card -->
      <Card v-if="currentQuestion" class="p-6" @copy="preventCheat" @cut="preventCheat" @contextmenu.prevent>
        <div class="flex items-center gap-2 mb-4">
          <Badge variant="secondary" class="text-[10px]">{{ currentQuestion.category }}</Badge>
          <Badge variant="outline" class="text-[10px]">{{ currentQuestion.difficulty }}</Badge>
          <Badge variant="outline" class="text-[10px]">{{ formatQuestionType(currentQuestion.questionType) }}</Badge>
        </div>

        <h3 class="font-semibold text-sm mb-4">Soal {{ currentIndex + 1 }}: {{ currentQuestion.questionText }}</h3>

        <!-- Multiple Choice -->
        <div v-if="currentQuestion.questionType === 'multiple_choice'" class="space-y-2">
          <label
            v-for="opt in (currentQuestion.options || [])"
            :key="opt.label"
            :class="[
              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
              answers[currentQuestion.id] === opt.label
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border hover:border-muted-foreground/30',
            ]"
            @click="selectAnswer(currentQuestion.id, opt.label)"
          >
            <div
              :class="[
                'flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold flex-shrink-0',
                answers[currentQuestion.id] === opt.label
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/40',
              ]"
            >
              {{ opt.label }}
            </div>
            <span class="text-sm">{{ opt.text }}</span>
          </label>
        </div>

        <!-- Essay -->
        <div v-else>
          <textarea
            :value="answers[currentQuestion.id] || ''"
            @input="e => selectAnswer(currentQuestion.id, e.target.value)"
            rows="5"
            placeholder="Tulis jawaban Anda..."
            class="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
            @copy="preventCheat"
            @cut="preventCheat"
          />
        </div>

        <!-- Navigation -->
        <div class="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <Button variant="outline" size="sm" :disabled="currentIndex === 0" @click="goTo(currentIndex - 1)">
            <ChevronLeft class="h-4 w-4 mr-1" /> Sebelumnya
          </Button>

          <div class="flex gap-1">
            <button
              v-for="i in totalQuestions"
              :key="i"
              :class="[
                'h-7 w-7 rounded text-[11px] font-medium transition-colors',
                currentIndex === i - 1 ? 'bg-primary text-primary-foreground' :
                  answers[questions[i - 1]?.id] ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground',
              ]"
              @click="goTo(i - 1)"
            >
              {{ i }}
            </button>
          </div>

          <Button v-if="currentIndex < totalQuestions - 1" size="sm" @click="goTo(currentIndex + 1)">
            Selanjutnya <ChevronRight class="h-4 w-4 ml-1" />
          </Button>
          <Button v-else size="sm" @click="confirmSubmit">
            <Check class="h-4 w-4 mr-1" /> Selesai
          </Button>
        </div>
      </Card>

      <!-- Confirm submit modal -->
      <Teleport to="body">
        <div v-if="showConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showConfirm = false">
          <Card class="w-full max-w-sm p-6 shadow-xl">
            <div class="flex items-start gap-4">
              <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <AlertTriangle class="h-5 w-5" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-sm">Kirim Jawaban?</h3>
                <p class="text-xs text-muted-foreground mt-1">
                  Kamu menjawab <strong>{{ answeredCount }}</strong> dari <strong>{{ totalQuestions }}</strong> soal.
                  {{ answeredCount < totalQuestions ? `${totalQuestions - answeredCount} soal belum dijawab.` : "" }}
                </p>
                <div class="flex gap-2 mt-4">
                  <Button size="sm" :disabled="state === 'submitting'" @click="submitAnswers">
                    <Loader2 v-if="state === 'submitting'" class="h-3.5 w-3.5 mr-1 animate-spin" />
                    {{ state === 'submitting' ? "Mengirim..." : "Kirim" }}
                  </Button>
                  <Button variant="outline" size="sm" @click="showConfirm = false">Lanjutkan Mengerjakan</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Teleport>
    </div>

    <!-- DONE STATE: Results -->
    <div v-if="state === 'done'" class="max-w-xl mx-auto py-16 px-4">
      <Card class="p-8 text-center">
        <div class="flex h-20 w-20 items-center justify-center rounded-full mx-auto mb-5"
          :class="result.score >= 70 ? 'bg-emerald-100' : result.score >= 40 ? 'bg-amber-100' : 'bg-red-100'">
          <span class="text-3xl font-bold"
            :class="result.score >= 70 ? 'text-emerald-600' : result.score >= 40 ? 'text-amber-600' : 'text-red-600'">
            {{ result.score }}
          </span>
        </div>

        <h1 class="text-2xl font-bold mb-2">Tes Selesai!</h1>
        <p class="text-sm text-muted-foreground mb-6">
          {{ result.score >= 70 ? "Hasil bagus! Kamu siap untuk magang." : result.score >= 40 ? "Cukup baik, tingkatkan lagi." : "Terus belajar, kamu bisa lebih baik." }}
        </p>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-secondary/30 rounded-lg p-3">
            <p class="text-lg font-bold">{{ result.answered }}</p>
            <p class="text-[10px] text-muted-foreground">Dijawab</p>
          </div>
          <div class="bg-secondary/30 rounded-lg p-3">
            <p class="text-lg font-bold">{{ result.total }}</p>
            <p class="text-[10px] text-muted-foreground">Total Soal</p>
          </div>
        </div>

        <div class="flex gap-3">
          <Button class="flex-1" @click="router.push('/internship-needs/browse')">
            Cari Magang
          </Button>
          <Button variant="outline" class="flex-1" @click="router.push('/dashboard')">
            Kembali ke Dashboard
          </Button>
        </div>
      </Card>
    </div>
  </div>
</template>
