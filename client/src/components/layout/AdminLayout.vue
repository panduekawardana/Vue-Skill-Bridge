<script setup>
import { computed } from "vue"
import { useRouter, useRoute } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import {
  LayoutDashboard, Users, Building2, FileQuestion, Briefcase, Shuffle,
  Ticket, Settings, LogOut, Shield,
} from "@lucide/vue"

defineProps({
  title: { type: String, default: "Dashboard" },
})

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const roleLevel = computed(() => auth.userRoleLevel || "support")

const menuItems = computed(() => [
  { label: "Dashboard", icon: LayoutDashboard, route: "/admin/dashboard", show: true },
  { label: "Users", icon: Users, route: "/admin/users", show: true },
  { label: "Verifikasi UMKM", icon: Building2, route: "/admin/verification", show: roleLevel.value !== "support" },
  { label: "Soal Skill Test", icon: FileQuestion, route: "/admin/questions", show: roleLevel.value !== "support" },
  { label: "Magang", icon: Briefcase, route: "/admin/internships", show: roleLevel.value !== "support" },
  { label: "Match Override", icon: Shuffle, route: "/admin/matches", show: roleLevel.value === "superadmin" },
  { label: "Tiket Bantuan", icon: Ticket, route: "/admin/tickets", show: true },
  { label: "Pengaturan", icon: Settings, route: "/admin/settings", show: roleLevel.value === "superadmin" },
].filter(m => m.show))

const roleBadge = computed(() => {
  const map = { superadmin: "Super Admin", moderator: "Moderator", support: "Support" }
  return map[roleLevel.value] || "Admin"
})

const roleColor = computed(() => {
  const map = { superadmin: "bg-amber-100 text-amber-700", moderator: "bg-blue-100 text-blue-700", support: "bg-gray-100 text-gray-700" }
  return map[roleLevel.value] || "bg-gray-100 text-gray-700"
})

function handleLogout() {
  auth.logout()
  router.push("/admin/login")
}

function isActive(path) {
  return route.path === path || route.path.startsWith(path + "/")
}
</script>

<template>
  <div class="min-h-screen bg-secondary/20 flex">
    <aside class="w-64 border-r border-border bg-white flex flex-col flex-shrink-0">
      <div class="p-5 border-b border-border">
        <div class="flex items-center gap-3 mb-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white">
            <Shield class="h-5 w-5" />
          </div>
          <div>
            <p class="text-sm font-bold">Skill Bridge</p>
            <p class="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
            {{ auth.user?.fullName?.charAt(0)?.toUpperCase() || "?" }}
          </div>
          <div class="min-w-0">
            <p class="text-xs font-semibold truncate">{{ auth.user?.fullName }}</p>
            <span :class="['inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium', roleColor]">
              {{ roleBadge }}
            </span>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <button
          v-for="item in menuItems"
          :key="item.route"
          :class="[
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
            isActive(item.route)
              ? 'bg-amber-50 text-amber-700'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
          ]"
          @click="router.push(item.route)"
        >
          <component :is="item.icon" class="h-4 w-4 flex-shrink-0" />
          {{ item.label }}
        </button>
      </nav>

      <div class="p-3 border-t border-border">
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
      <header class="h-14 border-b border-border bg-white flex items-center px-6">
        <span class="text-sm font-semibold text-foreground">{{ title }}</span>
      </header>

      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
