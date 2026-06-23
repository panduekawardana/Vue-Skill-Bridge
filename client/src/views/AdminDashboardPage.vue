<script setup>
import AdminLayout from "@/components/layout/AdminLayout.vue"
import AdminDashboardView from "@/components/admin/AdminDashboardView.vue"
import AdminUsersView from "@/components/admin/AdminUsersView.vue"
import AdminVerificationView from "@/components/admin/AdminVerificationView.vue"
import AdminQuestionsView from "@/components/admin/AdminQuestionsView.vue"
import AdminInternshipsView from "@/components/admin/AdminInternshipsView.vue"
import AdminMatchesView from "@/components/admin/AdminMatchesView.vue"
import AdminTicketsView from "@/components/admin/AdminTicketsView.vue"
import AdminSettingsView from "@/components/admin/AdminSettingsView.vue"
import { useRoute } from "vue-router"
import { computed } from "vue"

const route = useRoute()

const pageTitle = computed(() => {
  const map = {
    "admin-dashboard": "Dashboard",
    "admin-users": "Users",
    "admin-verification": "Verifikasi UMKM",
    "admin-questions": "Soal Skill Test",
    "admin-internships": "Magang",
    "admin-matches": "Match Override",
    "admin-tickets": "Tiket Bantuan",
    "admin-settings": "Pengaturan",
  }
  return map[route.name] || "Dashboard"
})

const page = computed(() => route.name)
</script>

<template>
  <AdminLayout :title="pageTitle">
    <AdminDashboardView v-if="page === 'admin-dashboard'" />
    <AdminUsersView v-else-if="page === 'admin-users'" />
    <AdminVerificationView v-else-if="page === 'admin-verification'" />
    <AdminQuestionsView v-else-if="page === 'admin-questions'" />
    <AdminInternshipsView v-else-if="page === 'admin-internships'" />
    <AdminMatchesView v-else-if="page === 'admin-matches'" />
    <AdminTicketsView v-else-if="page === 'admin-tickets'" />
    <AdminSettingsView v-else-if="page === 'admin-settings'" />
  </AdminLayout>
</template>
