<script setup>
import { ref, onMounted } from "vue"
import { useAuthStore } from "@/stores/auth"
import Card from "@/components/ui/Card.vue"
import { api } from "@/lib/api"
import { Users, Building2, Zap, ClipboardCheck, UserCheck, Shield } from "@lucide/vue"

const auth = useAuthStore()

const stats = ref({
  totalStudents: 0, totalUmkm: 0, totalAdmins: 0,
  activeInternships: 0, pendingMatches: 0, completedInternships: 0,
  unverifiedUmkm: 0,
})

const adminLevelLabel = {
  superadmin: "Super Admin",
  moderator: "Moderator",
  support: "Support",
}

onMounted(async () => {
  try { stats.value = await api.getAdminStats() } catch {}
})
</script>

<template>
  <div class="space-y-6 max-w-4xl">
    <div>
      <h1 class="text-2xl font-bold">Dashboard {{ adminLevelLabel[auth.user?.roleLevel] || "Admin" }}</h1>
      <p class="text-muted-foreground mt-1">Pantau dan kelola seluruh aktivitas platform.</p>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Card class="p-5">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 mb-3 w-fit">
          <Users class="h-4 w-4" />
        </div>
        <p class="text-2xl font-bold">{{ stats.totalStudents }}</p>
        <p class="text-xs text-muted-foreground">Total Siswa</p>
      </Card>
      <Card class="p-5">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600 mb-3 w-fit">
          <Building2 class="h-4 w-4" />
        </div>
        <p class="text-2xl font-bold">{{ stats.totalUmkm }}</p>
        <p class="text-xs text-muted-foreground">Total UMKM</p>
      </Card>
      <Card class="p-5">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 mb-3 w-fit">
          <Zap class="h-4 w-4" />
        </div>
        <p class="text-2xl font-bold">{{ stats.activeInternships }}</p>
        <p class="text-xs text-muted-foreground">Magang Aktif</p>
      </Card>
      <Card class="p-5">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 mb-3 w-fit">
          <ClipboardCheck class="h-4 w-4" />
        </div>
        <p class="text-2xl font-bold">{{ stats.completedInternships }}</p>
        <p class="text-xs text-muted-foreground">Selesai</p>
      </Card>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card class="p-6">
        <h2 class="font-semibold mb-4">Verifikasi UMKM</h2>
        <div class="text-center py-6 text-muted-foreground">
          <UserCheck class="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p class="text-sm">{{ stats.unverifiedUmkm }} UMKM menunggu verifikasi</p>
        </div>
      </Card>
      <Card class="p-6">
        <h2 class="font-semibold mb-4">Match Pending</h2>
        <div class="text-center py-6 text-muted-foreground">
          <Shield class="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p class="text-sm">{{ stats.pendingMatches }} match menunggu konfirmasi</p>
        </div>
      </Card>
    </div>
  </div>
</template>
