<script setup>
import { ref, computed, onMounted } from "vue"
import { useRouter, useRoute } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import Card from "@/components/ui/Card.vue"
import Button from "@/components/ui/Button.vue"
import { api } from "@/lib/api"
import { Loader2, Plus, X } from "@lucide/vue"
import DashboardLayout from "@/components/layout/DashboardLayout.vue"

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const isEdit = computed(() => !!route.params.id)

const majors = [
  "Rekayasa Perangkat Lunak", "Teknik Komputer dan Jaringan", "Multimedia",
  "Akuntansi", "Administrasi Perkantoran", "Pemasaran",
  "Tata Boga", "Tata Busana", "Desain Komunikasi Visual",
  "Elektronika Industri", "Mesin Produksi", "Otomotif",
  "Farmasi", "Keperawatan", "Perhotelan",
]

const form = ref({
  title: "",
  description: "",
  requiredSkills: [],
  requiredMajor: "",
  slotCount: 1,
  durationDays: 14,
  compensation: "",
  startDate: "",
})

const skillInput = ref("")
const saving = ref(false)
const loadingNeed = ref(false)
const errorMsg = ref("")

function addSkill() {
  const s = skillInput.value.trim()
  if (s && !form.value.requiredSkills.includes(s)) {
    form.value.requiredSkills.push(s)
  }
  skillInput.value = ""
}

function removeSkill(i) {
  form.value.requiredSkills.splice(i, 1)
}

onMounted(async () => {
  if (!isEdit.value) return
  loadingNeed.value = true
  try {
    const need = await api.get(`/internships/needs/${route.params.id}`)
    form.value = {
      title: need.title || "",
      description: need.description || "",
      requiredSkills: Array.isArray(need.requiredSkills) ? need.requiredSkills : [],
      requiredMajor: need.requiredMajor || "",
      slotCount: need.slotCount || 1,
      durationDays: need.durationDays || 14,
      compensation: need.compensation || "",
      startDate: need.startDate ? need.startDate.slice(0, 10) : "",
    }
  } catch (e) {
    errorMsg.value = e.message
  }
  loadingNeed.value = false
})

async function save() {
  saving.value = true
  errorMsg.value = ""
  const body = {
    title: form.value.title,
    description: form.value.description,
    requiredSkills: form.value.requiredSkills,
    requiredMajor: form.value.requiredMajor || null,
    slotCount: Number(form.value.slotCount),
    durationDays: Number(form.value.durationDays),
    compensation: form.value.compensation || null,
    startDate: form.value.startDate || null,
  }
  try {
    if (isEdit.value) {
      await api.put(`/internships/needs/${route.params.id}`, body)
    } else {
      await api.post("/internships/needs", body)
    }
    router.push("/dashboard")
  } catch (e) {
    errorMsg.value = e.message
  }
  saving.value = false
}

const isVerified = computed(() => auth.profile?.isVerified)
</script>

<template>
  <DashboardLayout title="Pasang Kebutuhan">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold mb-1">{{ isEdit ? "Edit Kebutuhan" : "Pasang Kebutuhan Baru" }}</h1>
    <p class="text-muted-foreground text-sm mb-6">{{ isEdit ? "Ubah detail kebutuhan magang Anda." : "Isi detail kebutuhan magang untuk dicocokkan dengan siswa." }}</p>

    <div v-if="loadingNeed" class="text-center py-12 text-muted-foreground">Memuat data kebutuhan...</div>

    <template v-else>
      <div v-if="!isEdit && !isVerified" class="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 mb-6">
        Akun UMKM Anda belum diverifikasi oleh admin. Harap tunggu verifikasi sebelum dapat memasang kebutuhan.
      </div>

      <div v-if="errorMsg" class="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive mb-6">
        {{ errorMsg }}
      </div>

      <Card class="p-6">
        <form @submit.prevent="save" class="space-y-5">
          <div class="space-y-1.5">
            <label class="text-sm font-medium">Judul Kebutuhan <span class="text-destructive">*</span></label>
            <input v-model="form.title" required placeholder="Mis: Asisten Pengembang Web"
              class="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium">Deskripsi</label>
            <textarea v-model="form.description" rows="4" placeholder="Deskripsikan pekerjaan yang akan dilakukan siswa..."
              class="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-sm font-medium">Jurusan <span class="text-destructive">*</span></label>
              <select v-model="form.requiredMajor" required
                class="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                <option value="">Pilih jurusan</option>
                <option v-for="m in majors" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
            <div class="space-y-1.5">
              <label class="text-sm font-medium">Jumlah Slot <span class="text-destructive">*</span></label>
              <input v-model.number="form.slotCount" type="number" min="1" max="50" required
                class="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-sm font-medium">Durasi (hari)</label>
              <input v-model.number="form.durationDays" type="number" min="7" max="90"
                class="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            </div>
            <div class="space-y-1.5">
              <label class="text-sm font-medium">Tanggal Mulai</label>
              <input v-model="form.startDate" type="date"
                class="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium">Kompensasi</label>
            <input v-model="form.compensation" placeholder="Mis: Rp 500.000/bulan"
              class="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-medium">Keahlian yang Dibutuhkan</label>
            <div class="flex gap-2">
              <input v-model="skillInput" placeholder="Ketik skill lalu Enter" @keydown.enter.prevent="addSkill"
                class="flex-1 h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
              <Button type="button" variant="outline" size="sm" @click="addSkill"><Plus class="h-4 w-4" /></Button>
            </div>
            <div class="flex flex-wrap gap-1.5 mt-2">
              <span v-for="(s, i) in form.requiredSkills" :key="i"
                class="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                {{ s }}
                <button type="button" class="hover:text-destructive" @click="removeSkill(i)"><X class="h-3 w-3" /></button>
              </span>
            </div>
          </div>

          <Button type="submit" class="w-full" :disabled="saving || loadingNeed || (!isEdit && !isVerified)">
            <Loader2 v-if="saving" class="h-4 w-4 mr-2 animate-spin" />
            {{ saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Pasang Kebutuhan" }}
          </Button>
        </form>
      </Card>
    </template>
    </div>
  </DashboardLayout>
</template>
