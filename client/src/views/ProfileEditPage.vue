<script setup>
import { ref, reactive, watch, computed, onUnmounted } from "vue"
import { useRouter, useRoute } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import { useNotificationStore } from "@/stores/notification"
import Card from "@/components/ui/Card.vue"
import Button from "@/components/ui/Button.vue"
import { api } from "@/lib/api"
import {
  Loader2, Save, User, Building2, School, BookOpen, MapPin, Hash,
  Briefcase, Globe, Phone, FileText, Tag, LogOut, Pencil, LayoutDashboard,
  Bell, CheckCheck, ExternalLink, X, Calendar, Mail, Award
} from "@lucide/vue"

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const notif = useNotificationStore()

const editing = ref(false)
const saving = ref(false)
const errorMsg = ref("")
const successMsg = ref("")

const showNotif = ref(false)
let pollTimer = null

const majors = ["Rekayasa Perangkat Lunak", "Teknik Komputer dan Jaringan", "Multimedia", "Akuntansi", "Administrasi Perkantoran", "Pemasaran"]
const businessTypes = ["Kuliner", "Fashion", "Teknologi", "Pendidikan", "Kesehatan", "Pertanian", "Kreatif", "Jasa", "Lainnya"]

const isStudent = computed(() => auth.userRole === "student")

const roleLabel = { student: "Siswa SMK", umkm: "UMKM", admin: "Admin" }
const roleColor = {
  student: "bg-blue-100 text-blue-700",
  umkm: "bg-purple-100 text-purple-700",
  admin: "bg-amber-100 text-amber-700",
}

const profileNav = [
  { label: "Profil Saya", icon: User, path: "/profile/edit" },
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Notifikasi", icon: Bell, path: "/notifications" },
]

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

const skillsArray = computed(() => {
  if (!Array.isArray(auth.profile?.skills)) return []
  return auth.profile.skills
})

function populateForm() {
  if (!auth.profile) return
  form.fullName = auth.user?.fullName || ""
  if (isStudent.value) {
    form.school = auth.profile.school || ""
    form.major = auth.profile.major || ""
    form.nisn = auth.profile.nisn || ""
    form.graduationYear = auth.profile.graduationYear || ""
    form.bio = auth.profile.bio || ""
    form.skills = skillsArray.value.join(", ")
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

function startEditing() {
  populateForm()
  editing.value = true
  window.scrollTo({ top: 0, behavior: "smooth" })
}

function cancelEditing() {
  editing.value = false
  errorMsg.value = ""
  successMsg.value = ""
}

async function saveProfile() {
  saving.value = true
  errorMsg.value = ""
  successMsg.value = ""

  try {
    const profileId = auth.profile?.id
    if (!profileId) throw new Error("Profile not loaded")

    if (isStudent.value) {
      const skills = form.skills
        ? form.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : []

      await api.put(`/profiles/students/${profileId}`, {
        fullName: form.fullName,
        school: form.school,
        major: form.major,
        nisn: form.nisn || undefined,
        graduationYear: form.graduationYear ? parseInt(form.graduationYear) : undefined,
        bio: form.bio || undefined,
        skills: skills.length > 0 ? skills : undefined,
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
    editing.value = false
    successMsg.value = "Profil berhasil disimpan!"
    setTimeout(() => { successMsg.value = "" }, 3000)
  } catch (e) {
    errorMsg.value = e.message
  }
  saving.value = false
}

function isActive(path) {
  return route.path === path
}

function handleLogout() {
  auth.logout()
  router.push("/")
}

function toggleNotif() {
  showNotif.value = !showNotif.value
  if (showNotif.value) {
    notif.fetchNotifications(5)
  }
}

function closeNotif() {
  showNotif.value = false
}

function handleClickOutside(e) {
  if (showNotif.value && !e.target.closest(".notif-container")) {
    closeNotif()
  }
}

function formatTime(dateStr) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return "baru saja"
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}j`
  if (diff < 604800) return `${Math.floor(diff / 86400)}h`
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
}

function initNotifPoll() {
  notif.fetchUnreadCount()
  pollTimer = setInterval(() => notif.fetchUnreadCount(), 15000)
  document.addEventListener("click", handleClickOutside)
}

function cleanupNotifPoll() {
  if (pollTimer) clearInterval(pollTimer)
  document.removeEventListener("click", handleClickOutside)
}

initNotifPoll()
onUnmounted(cleanupNotifPoll)

function emptyVal(val) {
  return val && String(val).trim() ? val : null
}

const joinDate = computed(() => {
  if (!auth.user?.createdAt) return null
  return new Date(auth.user.createdAt).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
})

const personalFields = computed(() => {
  const base = [
    { icon: Mail, label: "Email", value: auth.user?.email },
    { icon: Phone, label: "Telepon", value: auth.user?.phone },
  ]
  if (joinDate.value) {
    base.push({ icon: Calendar, label: "Bergabung", value: joinDate.value })
  }
  if (auth.user?.isVerified) {
    base.push({ icon: Award, label: "Verifikasi", value: "Terverifikasi" })
  }
  return base
})

const studentEduFields = computed(() => [
  { key: "school", icon: School, label: "Asal SMK" },
  { key: "major", icon: BookOpen, label: "Jurusan" },
  { key: "nisn", icon: Hash, label: "NISN" },
  { key: "graduationYear", icon: Calendar, label: "Tahun Lulus" },
])

const studentSkillFields = computed(() => [
  { key: "skills", icon: Tag, label: "Skills" },
  { key: "bio", icon: FileText, label: "Bio" },
  { key: "portfolioUrl", icon: Globe, label: "Portofolio" },
])

const umkmBusinessFields = computed(() => [
  { key: "businessName", icon: Building2, label: "Nama Usaha" },
  { key: "businessType", icon: Briefcase, label: "Bidang Usaha" },
  { key: "nib", icon: Hash, label: "NIB" },
  { key: "taxId", icon: Hash, label: "NPWP" },
])

const umkmProfileFields = computed(() => [
  { key: "description", icon: FileText, label: "Deskripsi" },
  { key: "phoneOffice", icon: Phone, label: "Telepon" },
  { key: "website", icon: Globe, label: "Website" },
])

const locationFields = computed(() => [
  { key: "city", icon: MapPin, label: "Kota" },
  { key: "address", icon: MapPin, label: "Alamat" },
])
</script>

<template>
  <div class="min-h-screen bg-secondary/20 flex">
    <aside class="w-64 border-r border-border bg-white flex flex-col flex-shrink-0">
      <div class="p-5 border-b border-border">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
            {{ auth.user?.fullName?.charAt(0)?.toUpperCase() || "?" }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold truncate">{{ auth.user?.fullName }}</p>
            <span
              :class="['inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5', roleColor[auth.userRole] || 'bg-gray-100 text-gray-700']"
            >
              {{ roleLabel[auth.userRole] || auth.userRole }}
            </span>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-4 space-y-1">
        <button
          v-for="item in profileNav"
          :key="item.path"
          @click="router.push(item.path)"
          :class="[
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive(item.path)
              ? 'text-foreground bg-primary/10 hover:bg-primary/15'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
          ]"
        >
          <component :is="item.icon" class="h-4 w-4" />
          <span class="flex-1 text-left">{{ item.label }}</span>
          <span
            v-if="item.path === '/notifications' && notif.unreadCount > 0"
            class="h-5 min-w-[20px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1"
          >
            {{ notif.unreadCount > 99 ? "99+" : notif.unreadCount }}
          </span>
        </button>
      </nav>

      <div class="p-4 border-t border-border space-y-1">
        <button
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          @click="handleLogout"
        >
          <LogOut class="h-4 w-4" />
          Keluar
        </button>
      </div>
    </aside>

    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-16 border-b border-border bg-white flex items-center px-6 gap-4">
        <div class="flex items-center gap-2 mr-auto">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            SB
          </div>
          <span class="font-bold">Skill Bridge</span>
        </div>
        <span class="text-sm font-medium text-foreground">Profil Saya</span>

        <div class="relative notif-container">
          <button
            class="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary transition-colors"
            @click.stop="toggleNotif"
          >
            <Bell class="h-4.5 w-4.5" />
            <span
              v-if="notif.unreadCount > 0"
              class="absolute -top-0.5 -right-0.5 h-4.5 min-w-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-1"
            >
              {{ notif.unreadCount > 9 ? "9+" : notif.unreadCount }}
            </span>
          </button>

          <div
            v-if="showNotif"
            class="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-border shadow-lg overflow-hidden z-50"
          >
            <div class="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 class="text-sm font-semibold">Notifikasi</h3>
              <button
                v-if="notif.unreadCount > 0"
                class="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                @click="notif.markAllRead()"
              >
                <CheckCheck class="h-3 w-3" /> Baca Semua
              </button>
            </div>

            <div class="max-h-80 overflow-y-auto">
              <div v-if="notif.items.length === 0" class="py-10 text-center">
                <Bell class="h-6 w-6 mx-auto mb-2 opacity-30 text-muted-foreground" />
                <p class="text-xs text-muted-foreground">Tidak ada notifikasi</p>
              </div>

              <button
                v-for="n in notif.items"
                :key="n.id"
                class="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0"
                :class="!n.isRead ? 'bg-primary/5' : ''"
                @click="notif.markRead(n.id)"
              >
                <div
                  class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                  :class="!n.isRead ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'"
                >
                  <Bell class="h-3.5 w-3.5" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium" :class="!n.isRead ? 'text-foreground' : 'text-muted-foreground'">{{ n.title }}</p>
                  <p class="text-[10px] text-muted-foreground truncate">{{ n.body }}</p>
                  <p class="text-[9px] text-muted-foreground/60 mt-0.5">{{ formatTime(n.createdAt) }}</p>
                </div>
              </button>
            </div>

            <div class="border-t border-border px-4 py-2">
              <button
                class="w-full text-center text-xs text-primary hover:underline flex items-center justify-center gap-1"
                @click="router.push('/notifications'); closeNotif()"
              >
                <ExternalLink class="h-3 w-3" /> Lihat Semua
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 overflow-auto p-6">
        <p
          v-if="errorMsg"
          class="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive mb-6"
        >
          {{ errorMsg }}
        </p>
        <p
          v-if="successMsg"
          class="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 mb-6"
        >
          {{ successMsg }}
        </p>

        <!-- ======================== VIEW MODE ======================== -->
        <template v-if="!editing">
          <div class="relative h-44 rounded-2xl overflow-hidden mb-16 bg-gradient-to-br from-accent/20 via-accent/5 to-accent/30 border border-border">
            <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(35,131,226,0.15)_0%,_transparent_70%)]" />
          </div>

          <div class="relative -mt-28 mb-6 mx-6">
            <div class="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              <div class="flex h-24 w-24 items-center justify-center rounded-2xl bg-white border border-border shadow-lg text-primary text-3xl font-bold flex-shrink-0">
                {{ auth.user?.fullName?.charAt(0)?.toUpperCase() || "?" }}
              </div>
              <div class="flex-1 min-w-0 pt-2 sm:pt-0 sm:pb-1">
                <div class="flex items-center gap-3 flex-wrap">
                  <h1 class="text-2xl font-bold">{{ auth.user?.fullName }}</h1>
                  <span
                    :class="['text-xs px-2.5 py-0.5 rounded-full font-medium', roleColor[auth.userRole] || 'bg-gray-100 text-gray-700']"
                  >
                    {{ roleLabel[auth.userRole] || auth.userRole }}
                  </span>
                </div>
                <p class="text-sm text-muted-foreground mt-0.5">{{ auth.user?.email }}</p>
              </div>
              <Button variant="accent" class="flex-shrink-0" @click="startEditing">
                <Pencil class="h-4 w-4 mr-1.5" /> Edit Profil
              </Button>
            </div>
          </div>

          <Card class="p-6 mb-6">
            <h3 class="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <User class="h-4 w-4 text-muted-foreground" />
              Informasi Pribadi
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="(f, i) in personalFields"
                :key="i"
                class="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
              >
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary flex-shrink-0">
                  <component :is="f.icon" class="h-4 w-4" />
                </div>
                <div class="min-w-0">
                  <p class="text-xs text-muted-foreground">{{ f.label }}</p>
                  <p class="text-sm font-medium truncate">
                    <template v-if="f.label === 'Verifikasi'">
                      <span class="text-emerald-600 flex items-center gap-1">
                        <Award class="h-3.5 w-3.5" /> Terverifikasi
                      </span>
                    </template>
                    <template v-else>{{ f.value || "-" }}</template>
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card v-if="isStudent" class="p-6 mb-6">
            <h3 class="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <School class="h-4 w-4 text-muted-foreground" />
              Pendidikan
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="f in studentEduFields"
                :key="f.key"
                class="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
              >
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary flex-shrink-0">
                  <component :is="f.icon" class="h-4 w-4" />
                </div>
                <div class="min-w-0">
                  <p class="text-xs text-muted-foreground">{{ f.label }}</p>
                  <p class="text-sm font-medium truncate">
                    <span v-if="emptyVal(auth.profile?.[f.key])">{{ auth.profile[f.key] }}</span>
                    <span v-else class="text-muted-foreground/50 italic text-xs">Belum diisi</span>
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card v-if="isStudent" class="p-6 mb-6">
            <h3 class="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Award class="h-4 w-4 text-muted-foreground" />
              Kompetensi
            </h3>
            <div class="space-y-4">
              <div
                v-for="f in studentSkillFields"
                :key="f.key"
              >
                <div v-if="f.key === 'skills'" class="p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <p class="text-xs text-muted-foreground mb-2">{{ f.label }}</p>
                  <div v-if="skillsArray.length > 0" class="flex flex-wrap gap-1.5">
                    <span
                      v-for="(skill, si) in skillsArray"
                      :key="si"
                      class="text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2.5 py-0.5"
                    >
                      {{ skill }}
                    </span>
                  </div>
                  <p v-else class="text-sm text-muted-foreground/50 italic">Belum diisi</p>
                </div>
                <div v-else class="p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <p class="text-xs text-muted-foreground">{{ f.label }}</p>
                  <div v-if="f.key === 'bio'" class="mt-1">
                    <p v-if="emptyVal(auth.profile?.bio)" class="text-sm whitespace-pre-line">{{ auth.profile.bio }}</p>
                    <p v-else class="text-sm text-muted-foreground/50 italic">Belum diisi</p>
                  </div>
                  <div v-else-if="f.key === 'portfolioUrl'">
                    <a
                      v-if="emptyVal(auth.profile?.portfolioUrl)"
                      :href="auth.profile.portfolioUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      <Globe class="h-3.5 w-3.5" />
                      {{ auth.profile.portfolioUrl }}
                    </a>
                    <p v-else class="text-sm text-muted-foreground/50 italic">Belum diisi</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card v-if="!isStudent" class="p-6 mb-6">
            <h3 class="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 class="h-4 w-4 text-muted-foreground" />
              Detail Usaha
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="f in umkmBusinessFields"
                :key="f.key"
                class="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
              >
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary flex-shrink-0">
                  <component :is="f.icon" class="h-4 w-4" />
                </div>
                <div class="min-w-0">
                  <p class="text-xs text-muted-foreground">{{ f.label }}</p>
                  <p class="text-sm font-medium truncate">
                    <span v-if="emptyVal(auth.profile?.[f.key])">{{ auth.profile[f.key] }}</span>
                    <span v-else class="text-muted-foreground/50 italic text-xs">Belum diisi</span>
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card v-if="!isStudent" class="p-6 mb-6">
            <h3 class="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText class="h-4 w-4 text-muted-foreground" />
              Profil Usaha
            </h3>
            <div class="space-y-4">
              <div
                v-for="f in umkmProfileFields"
                :key="f.key"
              >
                <div class="p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <p class="text-xs text-muted-foreground">{{ f.label }}</p>
                  <div v-if="f.key === 'description'">
                    <p v-if="emptyVal(auth.profile?.description)" class="text-sm whitespace-pre-line mt-1">{{ auth.profile.description }}</p>
                    <p v-else class="text-sm text-muted-foreground/50 italic mt-1">Belum diisi</p>
                  </div>
                  <div v-else-if="f.key === 'website'">
                    <a
                      v-if="emptyVal(auth.profile?.website)"
                      :href="auth.profile.website"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      <Globe class="h-3.5 w-3.5" />
                      {{ auth.profile.website }}
                    </a>
                    <p v-else class="text-sm text-muted-foreground/50 italic mt-1">Belum diisi</p>
                  </div>
                  <div v-else>
                    <p v-if="emptyVal(auth.profile?.[f.key])" class="text-sm mt-1">{{ auth.profile[f.key] }}</p>
                    <p v-else class="text-sm text-muted-foreground/50 italic mt-1">Belum diisi</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card class="p-6 mb-6">
            <h3 class="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin class="h-4 w-4 text-muted-foreground" />
              Lokasi
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="f in locationFields"
                :key="f.key"
                class="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
              >
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary flex-shrink-0">
                  <component :is="f.icon" class="h-4 w-4" />
                </div>
                <div class="min-w-0">
                  <p class="text-xs text-muted-foreground">{{ f.label }}</p>
                  <p class="text-sm font-medium truncate">
                    <span v-if="emptyVal(auth.profile?.[f.key])">{{ auth.profile[f.key] }}</span>
                    <span v-else class="text-muted-foreground/50 italic text-xs">Belum diisi</span>
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </template>

        <!-- ======================== EDIT MODE ======================== -->
        <template v-else>
          <div class="mb-8">
            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/8 text-accent">
                <Pencil class="h-5 w-5" />
              </div>
              <div>
                <h1 class="text-xl font-bold">Edit Profil</h1>
                <p class="text-sm text-muted-foreground">Lengkapi data diri untuk meningkatkan kecocokan matchmaking</p>
              </div>
            </div>
          </div>

          <form @submit.prevent="saveProfile" class="space-y-6">
            <Card class="p-6">
              <h3 class="text-sm font-semibold text-foreground mb-5 flex items-center gap-2 pb-3 border-b border-border">
                <User class="h-4 w-4 text-muted-foreground" />
                Informasi Pribadi
              </h3>
              <div class="space-y-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium flex items-center gap-1.5"><User class="h-3.5 w-3.5 text-muted-foreground" /> Nama Lengkap</label>
                  <input
                    v-model="form.fullName"
                    type="text"
                    required
                    class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                  />
                </div>
              </div>
            </Card>

            <Card v-if="isStudent" class="p-6">
              <h3 class="text-sm font-semibold text-foreground mb-5 flex items-center gap-2 pb-3 border-b border-border">
                <School class="h-4 w-4 text-muted-foreground" />
                Pendidikan
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium flex items-center gap-1.5"><School class="h-3.5 w-3.5 text-muted-foreground" /> Asal SMK</label>
                  <input
                    v-model="form.school"
                    type="text"
                    required
                    class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium flex items-center gap-1.5"><BookOpen class="h-3.5 w-3.5 text-muted-foreground" /> Jurusan</label>
                  <select
                    v-model="form.major"
                    required
                    class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                  >
                    <option value="">Pilih Jurusan</option>
                    <option v-for="m in majors" :key="m" :value="m">{{ m }}</option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium flex items-center gap-1.5"><Hash class="h-3.5 w-3.5 text-muted-foreground" /> NISN</label>
                  <input
                    v-model="form.nisn"
                    type="text"
                    class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium">Tahun Lulus</label>
                  <input
                    v-model="form.graduationYear"
                    type="number"
                    class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                  />
                </div>
              </div>
            </Card>

            <Card v-if="isStudent" class="p-6">
              <h3 class="text-sm font-semibold text-foreground mb-5 flex items-center gap-2 pb-3 border-b border-border">
                <Award class="h-4 w-4 text-muted-foreground" />
                Kompetensi
              </h3>
              <div class="space-y-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium flex items-center gap-1.5"><Tag class="h-3.5 w-3.5 text-muted-foreground" /> Skills (pisahkan dengan koma)</label>
                  <input
                    v-model="form.skills"
                    type="text"
                    placeholder="JavaScript, Canva, Copywriting"
                    class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                  />
                  <p class="text-xs text-muted-foreground">Contoh: JavaScript, Canva, Copywriting, Excel</p>
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium flex items-center gap-1.5"><FileText class="h-3.5 w-3.5 text-muted-foreground" /> Bio</label>
                  <textarea
                    v-model="form.bio"
                    rows="3"
                    class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all resize-none"
                    placeholder="Ceritakan tentang dirimu..."
                  ></textarea>
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium flex items-center gap-1.5"><Globe class="h-3.5 w-3.5 text-muted-foreground" /> Portofolio URL</label>
                  <input
                    v-model="form.portfolioUrl"
                    type="url"
                    placeholder="https://github.com/..."
                    class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                  />
                </div>
              </div>
            </Card>

            <Card v-if="!isStudent" class="p-6">
              <h3 class="text-sm font-semibold text-foreground mb-5 flex items-center gap-2 pb-3 border-b border-border">
                <Building2 class="h-4 w-4 text-muted-foreground" />
                Detail Usaha
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium flex items-center gap-1.5"><Building2 class="h-3.5 w-3.5 text-muted-foreground" /> Nama Usaha</label>
                  <input
                    v-model="form.businessName"
                    type="text"
                    required
                    class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium flex items-center gap-1.5"><Briefcase class="h-3.5 w-3.5 text-muted-foreground" /> Bidang Usaha</label>
                  <select
                    v-model="form.businessType"
                    required
                    class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                  >
                    <option value="">Pilih Bidang</option>
                    <option v-for="t in businessTypes" :key="t" :value="t">{{ t }}</option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium flex items-center gap-1.5"><Hash class="h-3.5 w-3.5 text-muted-foreground" /> NIB</label>
                  <input
                    v-model="form.nib"
                    type="text"
                    class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium">NPWP</label>
                  <input
                    v-model="form.taxId"
                    type="text"
                    class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                  />
                </div>
              </div>
            </Card>

            <Card v-if="!isStudent" class="p-6">
              <h3 class="text-sm font-semibold text-foreground mb-5 flex items-center gap-2 pb-3 border-b border-border">
                <FileText class="h-4 w-4 text-muted-foreground" />
                Profil Usaha
              </h3>
              <div class="space-y-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium flex items-center gap-1.5"><FileText class="h-3.5 w-3.5 text-muted-foreground" /> Deskripsi Usaha</label>
                  <textarea
                    v-model="form.description"
                    rows="3"
                    class="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all resize-none"
                    placeholder="Deskripsikan usaha Anda..."
                  ></textarea>
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium flex items-center gap-1.5"><Phone class="h-3.5 w-3.5 text-muted-foreground" /> Telepon Kantor</label>
                  <input
                    v-model="form.phoneOffice"
                    type="tel"
                    class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium flex items-center gap-1.5"><Globe class="h-3.5 w-3.5 text-muted-foreground" /> Website</label>
                  <input
                    v-model="form.website"
                    type="url"
                    placeholder="https://..."
                    class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                  />
                </div>
              </div>
            </Card>

            <Card class="p-6">
              <h3 class="text-sm font-semibold text-foreground mb-5 flex items-center gap-2 pb-3 border-b border-border">
                <MapPin class="h-4 w-4 text-muted-foreground" />
                Lokasi
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium flex items-center gap-1.5"><MapPin class="h-3.5 w-3.5 text-muted-foreground" /> Kota</label>
                  <input
                    v-model="form.city"
                    type="text"
                    class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                  />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium flex items-center gap-1.5"><MapPin class="h-3.5 w-3.5 text-muted-foreground" /> Alamat</label>
                  <input
                    v-model="form.address"
                    type="text"
                    class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                  />
                </div>
              </div>
            </Card>

            <div class="sticky bottom-0 bg-secondary/20 backdrop-blur-md border border-border rounded-2xl p-4 flex items-center justify-end gap-3">
              <Button variant="ghost" @click="cancelEditing" :disabled="saving">
                <X class="h-4 w-4 mr-1.5" /> Batal
              </Button>
              <Button type="submit" :disabled="saving">
                <Loader2 v-if="saving" class="h-4 w-4 mr-2 animate-spin" />
                <Save v-else class="h-4 w-4 mr-2" />
                {{ saving ? "Menyimpan..." : "Simpan Profil" }}
              </Button>
            </div>
          </form>
        </template>
      </main>
    </div>
  </div>
</template>
