<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRouter, useRoute } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import { useNotificationStore } from "@/stores/notification"
import { LogOut, LayoutDashboard, Search, Plus, FileText, Zap, User, Building2, Bell, CheckCheck, ExternalLink } from "@lucide/vue"

defineProps({
  title: { type: String, default: "Dashboard" },
})

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const notif = useNotificationStore()

const showNotif = ref(false)
let pollTimer = null

const roleLabel = {
  student: "Siswa SMK",
  umkm: "UMKM",
  admin: "Admin",
}

const roleColor = {
  student: "bg-blue-100 text-blue-700",
  umkm: "bg-purple-100 text-purple-700",
  admin: "bg-amber-100 text-amber-700",
}

const studentNav = [
  { name: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "internship-needs-browse", label: "Cari Magang", icon: Search, path: "/internship-needs/browse" },
  { name: "skill-test", label: "Skill Test", icon: FileText, path: "/skill-test" },
  { name: "matchmaking", label: "Status Match", icon: Zap, path: "/matchmaking" },
  { name: "notifications", label: "Notifikasi", icon: Bell, path: "/notifications" },
  { name: "profile-edit", label: "Edit Profil", icon: User, path: "/profile/edit" },
]

const umkmNav = [
  { name: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "internship-need-new", label: "Pasang Kebutuhan", icon: Plus, path: "/internship-needs/new" },
  { name: "matchmaking", label: "Kandidat", icon: User, path: "/matchmaking" },
  { name: "notifications", label: "Notifikasi", icon: Bell, path: "/notifications" },
  { name: "profile-edit", label: "Profil UMKM", icon: Building2, path: "/profile/edit" },
]

const adminNav = [
  { name: "admin-dashboard", label: "Dashboard Admin", icon: LayoutDashboard, path: "/admin/dashboard" },
]

const navItems = auth.userRole === "student" ? studentNav : auth.userRole === "umkm" ? umkmNav : auth.userRole === "admin" ? adminNav : []

const notifTypeIcon = {
  match: "Zap",
  schedule: "Calendar",
  evaluation: "MessageSquare",
  certificate: "Medal",
  system: "Bell",
}

function isActive(path) {
  return route.path === path || route.path.startsWith(path + "/")
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

onMounted(() => {
  notif.fetchUnreadCount()
  pollTimer = setInterval(() => notif.fetchUnreadCount(), 15000)
  document.addEventListener("click", handleClickOutside)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  document.removeEventListener("click", handleClickOutside)
})
</script>

<template>
  <div class="min-h-screen bg-secondary/20 flex">
    <aside class="w-64 border-r border-border bg-white flex flex-col flex-shrink-0">
      <div class="p-5 border-b border-border">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
            {{ auth.user?.fullName?.charAt(0)?.toUpperCase() || "?" }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold truncate">{{ auth.user?.fullName }}</p>
            <span :class="['inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5', roleColor[auth.userRole] || 'bg-gray-100 text-gray-700']">
              {{ roleLabel[auth.userRole] || auth.userRole }}
            </span>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-4 space-y-1">
        <button
          v-for="item in navItems"
          :key="item.name"
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
          <span v-if="item.name === 'notifications' && notif.unreadCount > 0"
            class="h-5 min-w-[20px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
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
        <span class="text-sm font-medium text-foreground">{{ title }}</span>

        <!-- Notification bell -->
        <div class="relative notif-container">
          <button
            class="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary transition-colors"
            @click.stop="toggleNotif"
          >
            <Bell class="h-4.5 w-4.5" />
            <span v-if="notif.unreadCount > 0"
              class="absolute -top-0.5 -right-0.5 h-4.5 min-w-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-1">
              {{ notif.unreadCount > 9 ? "9+" : notif.unreadCount }}
            </span>
          </button>

          <!-- Dropdown -->
          <div v-if="showNotif"
            class="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-border shadow-lg overflow-hidden z-50">
            <div class="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 class="text-sm font-semibold">Notifikasi</h3>
              <div class="flex gap-1">
                <button v-if="notif.unreadCount > 0"
                  class="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                  @click="notif.markAllRead()">
                  <CheckCheck class="h-3 w-3" /> Baca Semua
                </button>
              </div>
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
                <div class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                  :class="!n.isRead ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'">
                  <Bell class="h-3.5 w-3.5" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium" :class="!n.isRead ? 'text-foreground' : 'text-muted-foreground'">
                    {{ n.title }}
                  </p>
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
        <slot />
      </main>
    </div>
  </div>
</template>
