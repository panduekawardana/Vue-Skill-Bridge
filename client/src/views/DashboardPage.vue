<script setup>
import { useAuthStore } from "@/stores/auth"
import DashboardLayout from "@/components/layout/DashboardLayout.vue"
import StudentView from "@/components/dashboard/StudentView.vue"
import UmkmView from "@/components/dashboard/UmkmView.vue"
import AdminView from "@/components/dashboard/AdminView.vue"
import { computed } from "vue"

const auth = useAuthStore()

const title = computed(() => {
  const map = { student: "Dashboard Siswa", umkm: "Dashboard UMKM", admin: "Dashboard Admin" }
  return map[auth.userRole] || "Dashboard"
})
</script>

<template>
  <DashboardLayout :title="title">
    <StudentView v-if="auth.userRole === 'student'" />
    <UmkmView v-else-if="auth.userRole === 'umkm'" />
    <AdminView v-else-if="auth.userRole === 'admin'" />
  </DashboardLayout>
</template>
