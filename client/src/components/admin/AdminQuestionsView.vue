<script setup>
import { ref, onMounted } from "vue"
import Card from "@/components/ui/Card.vue"
import Button from "@/components/ui/Button.vue"
import Badge from "@/components/ui/Badge.vue"
import { api } from "@/lib/api"
import { Plus, Pencil, Trash2, Search, AlertTriangle, X } from "@lucide/vue"

const questions = ref([])
const search = ref("")
const showForm = ref(false)
const editId = ref(null)
const errorMsg = ref("")
const deleteTarget = ref(null)
const form = ref({ category: "", difficulty: "beginner", questionText: "", questionType: "multiple_choice", options: [], pointValue: 10 })

async function loadQuestions() {
  errorMsg.value = ""
  try {
    questions.value = await api.get("/skill-test/questions")
  } catch (e) {
    errorMsg.value = e.message
  }
}

async function saveQuestion() {
  errorMsg.value = ""
  try {
    if (editId.value) {
      await api.put(`/skill-test/questions/${editId.value}`, form.value)
    } else {
      await api.post("/skill-test/questions", form.value)
    }
    showForm.value = false
    editId.value = null
    form.value = { category: "", difficulty: "beginner", questionText: "", questionType: "multiple_choice", options: [], pointValue: 10 }
    await loadQuestions()
  } catch (e) {
    errorMsg.value = e.message
  }
}

async function editQuestion(q) {
  editId.value = q.id
  form.value = { category: q.category, difficulty: q.difficulty, questionText: q.questionText, questionType: q.questionType, options: q.options || [], pointValue: q.pointValue }
  showForm.value = true
}

function confirmDelete(id) {
  deleteTarget.value = id
}

function cancelDelete() {
  deleteTarget.value = null
}

async function deleteQuestion() {
  if (!deleteTarget.value) return
  try {
    await api.delete(`/skill-test/questions/${deleteTarget.value}`)
    deleteTarget.value = null
    await loadQuestions()
  } catch (e) {
    errorMsg.value = e.message
    deleteTarget.value = null
  }
}

function addOption() {
  form.value.options.push({ label: String.fromCharCode(65 + form.value.options.length), text: "" })
}

function removeOption(i) {
  form.value.options.splice(i, 1)
}

onMounted(loadQuestions)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Bank Soal Skill Test</h1>
        <p class="text-muted-foreground mt-1">Kelola soal tes kompetensi.</p>
      </div>
      <Button @click="showForm = !showForm; editId = null; form = { category: '', difficulty: 'beginner', questionText: '', questionType: 'multiple_choice', options: [], pointValue: 10 }">
        <Plus class="h-4 w-4 mr-1.5" />Tambah Soal
      </Button>
    </div>

    <div v-if="errorMsg" class="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
      {{ errorMsg }}
    </div>

    <Card v-if="showForm" class="p-5">
      <h3 class="font-semibold mb-4">{{ editId ? "Edit Soal" : "Soal Baru" }}</h3>
      <form @submit.prevent="saveQuestion" class="space-y-4">
        <div class="grid grid-cols-3 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-medium">Kategori</label>
            <input v-model="form.category" required class="w-full h-9 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium">Level</label>
            <select v-model="form.difficulty" class="w-full h-9 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium">Tipe</label>
            <select v-model="form.questionType" class="w-full h-9 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50">
              <option value="multiple_choice">Pilihan Ganda</option>
              <option value="essay">Essay</option>
            </select>
          </div>
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-medium">Pertanyaan</label>
          <textarea v-model="form.questionText" required rows="3" class="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
        </div>
        <div v-if="form.questionType === 'multiple_choice'" class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-medium">Opsi Jawaban</label>
            <button type="button" class="text-xs text-primary hover:underline" @click="addOption">+ Tambah opsi</button>
          </div>
          <div v-for="(opt, i) in form.options" :key="i" class="flex items-center gap-2">
            <span class="text-xs font-bold w-5">{{ opt.label }}.</span>
            <input v-model="opt.text" class="flex-1 h-9 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            <button type="button" class="text-destructive text-xs hover:underline" @click="removeOption(i)">Hapus</button>
          </div>
        </div>
        <div class="flex gap-2">
          <Button type="submit">{{ editId ? "Simpan" : "Buat Soal" }}</Button>
          <Button type="button" variant="outline" @click="showForm = false">Batal</Button>
        </div>
      </form>
    </Card>

    <div class="space-y-3">
      <Card v-for="q in questions" :key="q.id" class="p-4">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <Badge variant="secondary" class="text-[10px]">{{ q.category }}</Badge>
              <Badge variant="outline" class="text-[10px]">{{ q.difficulty }}</Badge>
              <Badge variant="outline" class="text-[10px]">{{ q.questionType }}</Badge>
              <span class="text-xs text-muted-foreground">{{ q.pointValue }} pts</span>
              <Badge v-if="!q.isActive" variant="destructive" class="text-[10px]">Nonaktif</Badge>
            </div>
            <p class="text-sm font-medium">{{ q.questionText }}</p>
            <div v-if="q.options?.length" class="mt-1 flex gap-3 text-xs text-muted-foreground">
              <span v-for="o in q.options" :key="o.label">{{ o.label }}. {{ o.text }}</span>
            </div>
          </div>
          <div class="flex gap-1 flex-shrink-0">
            <Button variant="ghost" size="sm" @click="editQuestion(q)"><Pencil class="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" @click="confirmDelete(q.id)"><Trash2 class="h-3.5 w-3.5 text-destructive" /></Button>
          </div>
        </div>
      </Card>
      <p v-if="questions.length === 0" class="text-center text-muted-foreground py-8">Belum ada soal</p>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="deleteTarget"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="cancelDelete"
      >
        <Card class="w-full max-w-sm p-6 shadow-xl">
          <div class="flex items-start gap-4">
            <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle class="h-5 w-5" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-sm">Konfirmasi Nonaktifkan Soal</h3>
              <p class="text-xs text-muted-foreground mt-1">Yakin ingin menonaktifkan soal ini?</p>
              <div class="flex gap-2 mt-4">
                <Button variant="destructive" size="sm" @click="deleteQuestion">
                  <Trash2 class="h-3.5 w-3.5 mr-1.5" />Nonaktifkan
                </Button>
                <Button variant="outline" size="sm" @click="cancelDelete">Batal</Button>
              </div>
            </div>
            <button class="text-muted-foreground hover:text-foreground flex-shrink-0" @click="cancelDelete">
              <X class="h-4 w-4" />
            </button>
          </div>
        </Card>
      </div>
    </Teleport>
  </div>
</template>
