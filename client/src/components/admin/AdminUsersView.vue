<script setup>
import { ref, onMounted } from "vue"
import Card from "@/components/ui/Card.vue"
import Button from "@/components/ui/Button.vue"
import Badge from "@/components/ui/Badge.vue"
import { api } from "@/lib/api"
import { Search, Trash2, Shield, AlertTriangle, X } from "@lucide/vue"
import { useAuthStore } from "@/stores/auth"

const auth = useAuthStore()
const users = ref([])
const search = ref("")
const roleFilter = ref("")
const loading = ref(false)
const errorMsg = ref("")

const deleteTarget = ref(null)

async function loadUsers() {
  loading.value = true
  errorMsg.value = ""
  try {
    const params = new URLSearchParams()
    if (roleFilter.value) params.set("role", roleFilter.value)
    if (search.value) params.set("q", search.value)
    users.value = await api.getAdminUsers(params.toString())
  } catch (e) {
    errorMsg.value = e.message
  }
  loading.value = false
}

function confirmDelete(user) {
  deleteTarget.value = user
}

function cancelDelete() {
  deleteTarget.value = null
}

async function deleteUser() {
  if (!deleteTarget.value) return
  try {
    await api.deleteAdminUser(deleteTarget.value.id)
    deleteTarget.value = null
    await loadUsers()
  } catch (e) {
    errorMsg.value = e.message
    deleteTarget.value = null
  }
}

async function updateStatus(user, newStatus) {
  const isVerified = newStatus === "verified"
  try {
    if (user.role === "umkm") {
      const umkmList = await api.get("/profiles/umkm")
      const umkmProfile = Array.isArray(umkmList) ? umkmList.find(u => u.userId === user.id) : null
      if (umkmProfile) {
        await api.patch(`/profiles/umkm/${umkmProfile.id}/verify`, { isVerified })
      }
    } else {
      await api.patch(`/admin/users/${user.id}`, { isVerified })
    }
    await loadUsers()
  } catch (e) {
    errorMsg.value = e.message
  }
}

onMounted(loadUsers)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Manajemen Users</h1>
      <p class="text-muted-foreground mt-1">Kelola semua pengguna platform.</p>
    </div>

    <div v-if="errorMsg" class="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
      {{ errorMsg }}
    </div>

    <div class="flex gap-3 flex-wrap">
      <div class="relative flex-1 max-w-xs">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          v-model="search"
          placeholder="Cari nama/email/telepon..."
          class="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          @input="loadUsers"
        />
      </div>
      <select
        v-model="roleFilter"
        class="h-10 px-3 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        @change="loadUsers"
      >
        <option value="">Semua Role</option>
        <option value="student">Siswa</option>
        <option value="umkm">UMKM</option>
        <option value="admin">Admin</option>
      </select>
    </div>

    <Card class="overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-secondary/30">
              <th class="text-left px-4 py-3 font-medium">Nama</th>
              <th class="text-left px-4 py-3 font-medium">Email</th>
              <th class="text-left px-4 py-3 font-medium">Role</th>
              <th class="text-left px-4 py-3 font-medium">Status</th>
              <th class="text-right px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" class="border-b border-border last:border-0 hover:bg-secondary/20">
              <td class="px-4 py-3 font-medium">{{ u.fullName }}</td>
              <td class="px-4 py-3 text-muted-foreground">{{ u.email }}</td>
              <td class="px-4 py-3">
                <Badge :variant="u.role === 'admin' ? 'accent' : u.role === 'umkm' ? 'secondary' : 'default'">
                  {{ u.role === 'student' ? 'Siswa' : u.role.toUpperCase() }}
                </Badge>
              </td>
              <td class="px-4 py-3">
                <select
                  :value="u.isVerified ? 'verified' : 'unverified'"
                  class="h-8 text-xs px-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  @change="e => updateStatus(u, e.target.value)"
                >
                  <option value="unverified">Belum</option>
                  <option value="verified">Terverifikasi</option>
                </select>
              </td>
              <td class="px-4 py-3 text-right">
                <Button v-if="auth.userRoleLevel === 'superadmin'" variant="ghost" size="sm" @click="confirmDelete(u)">
                  <Trash2 class="h-4 w-4 text-destructive" />
                </Button>
              </td>
            </tr>
            <tr v-if="!loading && users.length === 0">
              <td colspan="5" class="px-4 py-8 text-center text-muted-foreground">Tidak ada user</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

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
              <h3 class="font-semibold text-sm">Konfirmasi Hapus User</h3>
              <p class="text-xs text-muted-foreground mt-1">
                Yakin ingin menghapus <strong>{{ deleteTarget.fullName }}</strong> ({{ deleteTarget.email }})? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div class="flex gap-2 mt-4">
                <Button variant="destructive" size="sm" @click="deleteUser">
                  <Trash2 class="h-3.5 w-3.5 mr-1.5" />Hapus
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
