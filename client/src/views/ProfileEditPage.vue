<script setup>
import { ref, reactive, watch } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import Card from "@/components/ui/Card.vue"
import Button from "@/components/ui/Button.vue"
import Badge from "@/components/ui/Badge.vue"
import { api } from "@/lib/api"
import { ArrowLeft, Loader2, Save, User, Building2, School, BookOpen, MapPin, Hash, Briefcase, Globe, Phone, FileText, Tag } from "@lucide/vue"

const router = useRouter()
const auth = useAuthStore()
const saving = ref(false)
const errorMsg = ref("")
const successMsg = ref("")

const majors = ["Rekayasa Perangkat Lunak", "Teknik Komputer dan Jaringan", "Multimedia", "Akuntansi", "Administrasi Perkantoran", "Pemasaran"]
const businessTypes = ["Kuliner", "Fashion", "Teknologi", "Pendidikan", "Kesehatan", "Pertanian", "Kreatif", "Jasa", "Lainnya"]

const isStudent = auth.userRole === "student"

const form = reactive({
  fullName: "",
  school: "",
  major: "",
  nisn: "",
  graduationYear: "",
  bio: "",
  skills: "",
  portfolioUrl: "",
  address: "",
  city: "",
  businessName: "",
  businessType: "",
  nib: "",
  taxId: "",
  description: "",
  phoneOffice: "",
  website: "",
})

function populateForm() {
  if (!auth.profile) return
  form.fullName = auth.user?.fullName || ""
  if (isStudent) {
    form.school = auth.profile.school || ""
    form.major = auth.profile.major || ""
    form.nisn = auth.profile.nisn || ""
    form.graduationYear = auth.profile.graduationYear || ""
    form.bio = auth.profile.bio || ""
    form.skills = Array.isArray(auth.profile.skills) ? auth.profile.skills.join(", ") : ""
    form.portfolioUrl = auth.profile.portfolioUrl || ""
    form.address = auth.profile.address || ""
    form.city = auth.profile.city || ""
  } else {
    form.businessName = auth.profile.businessName || ""
    form.businessType = auth.profile.businessType || ""
    form.nib = auth.profile.nib || ""
    form.taxId = auth.profile.taxId || ""
    form.description = auth.profile.description || ""
    form.address = auth.profile.address || ""
    form.city = auth.profile.city || ""
    form.phoneOffice = auth.profile.phoneOffice || ""
    form.website = auth.profile.website || ""
  }
}

populateForm()
watch(() => auth.profile, populateForm, { immediate: false })

async function saveProfile() {
  saving.value = true
  errorMsg.value = ""
  successMsg.value = ""

  try {
    const profileId = auth.profile?.id
    if (!profileId) throw new Error("Profile not loaded")

    if (isStudent) {
      const skillsArray = form.skills
        ? form.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : []

      await api.put(`/profiles/students/${profileId}`, {
        fullName: form.fullName,
        school: form.school,
        major: form.major,
        nisn: form.nisn || undefined,
        graduationYear: form.graduationYear ? parseInt(form.graduationYear) : undefined,
        bio: form.bio || undefined,
        skills: skillsArray.length > 0 ? skillsArray : undefined,
        portfolioUrl: form.portfolioUrl || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
      })
    } else {
      await api.put(`/profiles/umkm/${profileId}`, {
        fullName: form.fullName,
        businessName: form.businessName,
        businessType: form.businessType,
        nib: form.nib || undefined,
        taxId: form.taxId || undefined,
        description: form.description || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        phoneOffice: form.phoneOffice || undefined,
        website: form.website || undefined,
      })
    }

    await auth.fetchProfile()
    populateForm()
    successMsg.value = "Profil berhasil disimpan!"
    setTimeout(() => { successMsg.value = "" }, 3000)
  } catch (e) {
    errorMsg.value = e.message
  }
  saving.value = false
}
</script>

<template>
  <div class="max-w-2xl mx-auto py-10 px-4">
    <button class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6" @click="router.push('/dashboard')">
      <ArrowLeft class="h-4 w-4" /> Kembali ke Dashboard
    </button>

    <div class="flex items-center gap-3 mb-6">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <User class="h-5 w-5" />
      </div>
      <div>
        <h1 class="text-2xl font-bold">Edit Profil</h1>
        <p class="text-sm text-muted-foreground">Lengkapi data diri untuk meningkatkan kecocokan matchmaking</p>
      </div>
    </div>

    <p v-if="errorMsg" class="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive mb-6">{{ errorMsg }}</p>
    <p v-if="successMsg" class="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 mb-6">{{ successMsg }}</p>

    <Card class="p-6">
      <form @submit.prevent="saveProfile" class="space-y-6">
        <div class="space-y-2">
          <label class="text-sm font-medium flex items-center gap-1.5"><User class="h-3.5 w-3.5" /> Nama Lengkap</label>
          <input v-model="form.fullName" type="text" required
            class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
        </div>

        <!-- Student Fields -->
        <template v-if="isStudent">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium flex items-center gap-1.5"><School class="h-3.5 w-3.5" /> Asal SMK</label>
              <input v-model="form.school" type="text" required
                class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium flex items-center gap-1.5"><BookOpen class="h-3.5 w-3.5" /> Jurusan</label>
              <select v-model="form.major" required
                class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                <option value="">Pilih Jurusan</option>
                <option v-for="m in majors" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium flex items-center gap-1.5"><Hash class="h-3.5 w-3.5" /> NISN</label>
              <input v-model="form.nisn" type="text"
                class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Tahun Lulus</label>
              <input v-model="form.graduationYear" type="number"
                class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium flex items-center gap-1.5"><Tag class="h-3.5 w-3.5" /> Skills (pisahkan dengan koma)</label>
            <input v-model="form.skills" type="text" placeholder="JavaScript, Canva, Copywriting"
              class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            <p class="text-xs text-muted-foreground">Contoh: JavaScript, Canva, Copywriting, Excel</p>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium flex items-center gap-1.5"><FileText class="h-3.5 w-3.5" /> Bio</label>
            <textarea v-model="form.bio" rows="3"
              class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
              placeholder="Ceritakan tentang dirimu..."></textarea>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium flex items-center gap-1.5"><Globe class="h-3.5 w-3.5" /> Portofolio URL</label>
            <input v-model="form.portfolioUrl" type="url" placeholder="https://github.com/..."
              class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
          </div>
        </template>

        <!-- UMKM Fields -->
        <template v-else>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium flex items-center gap-1.5"><Building2 class="h-3.5 w-3.5" /> Nama Usaha</label>
              <input v-model="form.businessName" type="text" required
                class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium flex items-center gap-1.5"><Briefcase class="h-3.5 w-3.5" /> Bidang Usaha</label>
              <select v-model="form.businessType" required
                class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                <option value="">Pilih Bidang</option>
                <option v-for="t in businessTypes" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium flex items-center gap-1.5"><Hash class="h-3.5 w-3.5" /> NIB</label>
              <input v-model="form.nib" type="text"
                class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">NPWP</label>
              <input v-model="form.taxId" type="text"
                class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium flex items-center gap-1.5"><FileText class="h-3.5 w-3.5" /> Deskripsi Usaha</label>
            <textarea v-model="form.description" rows="3"
              class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
              placeholder="Deskripsikan usaha Anda..."></textarea>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium flex items-center gap-1.5"><Phone class="h-3.5 w-3.5" /> Telepon Kantor</label>
            <input v-model="form.phoneOffice" type="tel"
              class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium flex items-center gap-1.5"><Globe class="h-3.5 w-3.5" /> Website</label>
            <input v-model="form.website" type="url" placeholder="https://..."
              class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
          </div>
        </template>

        <!-- Shared Fields -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium flex items-center gap-1.5"><MapPin class="h-3.5 w-3.5" /> Kota</label>
            <input v-model="form.city" type="text"
              class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium flex items-center gap-1.5"><MapPin class="h-3.5 w-3.5" /> Alamat</label>
            <input v-model="form.address" type="text"
              class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
          </div>
        </div>

        <Button type="submit" class="w-full" :disabled="saving">
          <Loader2 v-if="saving" class="h-4 w-4 mr-2 animate-spin" />
          <Save v-else class="h-4 w-4 mr-2" />
          {{ saving ? "Menyimpan..." : "Simpan Profil" }}
        </Button>
      </form>
    </Card>
  </div>
</template>
