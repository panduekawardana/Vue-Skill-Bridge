<script setup>
import { useRouter, useRoute } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import { LogOut, LayoutDashboard, Search, Plus, FileText, Zap, User, Building2, Briefcase, ClipboardCheck } from "@lucide/vue"

defineProps({
  title: { type: String, default: "Dashboard" },
})

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

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
  { name: "profile-edit", label: "Edit Profil", icon: User, path: "/profile/edit" },
]

const umkmNav = [
  { name: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "internship-need-new", label: "Pasang Kebutuhan", icon: Plus, path: "/internship-needs/new" },
  { name: "matchmaking", label: "Kandidat", icon: User, path: "/matchmaking" },
  { name: "profile-edit", label: "Profil UMKM", icon: Building2, path: "/profile/edit" },
]

const navItems = auth.userRole === "student" ? studentNav : auth.userRole === "umkm" ? umkmNav : []

function isActive(path) {
  return route.path === path || route.path.startsWith(path + "/")
}

function handleLogout() {
  auth.logout()
  router.push("/")
}
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
          {{ item.label }}
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
      </header>

      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
