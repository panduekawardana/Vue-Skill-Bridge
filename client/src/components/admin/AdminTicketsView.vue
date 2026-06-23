<script setup>
import { ref, onMounted } from "vue"
import Card from "@/components/ui/Card.vue"
import Button from "@/components/ui/Button.vue"
import Badge from "@/components/ui/Badge.vue"
import { api } from "@/lib/api"
import { Ticket, Trash2 } from "@lucide/vue"
import { useAuthStore } from "@/stores/auth"

const auth = useAuthStore()
const tickets = ref([])

async function load() {
  try { tickets.value = await api.getAdminTickets() } catch {}
}

async function updateStatus(id, status) {
  try {
    await api.patch(`/admin/tickets/${id}`, { status })
    await load()
  } catch {}
}

async function deleteTicket(id) {
  if (!confirm("Hapus tiket ini?")) return
  try {
    await api.delete(`/admin/tickets/${id}`)
    await load()
  } catch {}
}

const statusColor = { open: "outline", in_progress: "default", resolved: "secondary", closed: "destructive" }
const priorityColor = { low: "outline", medium: "secondary", high: "destructive" }

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Tiket Bantuan</h1>
      <p class="text-muted-foreground mt-1">Kelola tiket bantuan pengguna.</p>
    </div>

    <div class="space-y-3">
      <Card v-for="t in tickets" :key="t.id" class="p-4">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <Badge :variant="statusColor[t.status] || 'outline'" class="text-[10px]">{{ t.status }}</Badge>
              <Badge :variant="priorityColor[t.priority] || 'outline'" class="text-[10px]">{{ t.priority }}</Badge>
              <span class="text-xs text-muted-foreground">{{ t.createdAt?.slice(0, 10) }}</span>
            </div>
            <h3 class="font-medium text-sm">{{ t.subject }}</h3>
            <p class="text-xs text-muted-foreground mt-0.5 line-clamp-2">{{ t.body }}</p>
          </div>
          <div class="flex gap-1 flex-shrink-0">
            <select
              :value="t.status"
              class="h-8 text-xs px-2 rounded border border-border bg-white"
              @change="e => updateStatus(t.id, e.target.value)"
            >
              <option value="open">Open</option>
              <option value="in_progress">Proses</option>
              <option value="resolved">Selesai</option>
              <option value="closed">Tutup</option>
            </select>
            <Button v-if="auth.userRoleLevel === 'superadmin'" variant="ghost" size="sm" @click="deleteTicket(t.id)">
              <Trash2 class="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      </Card>
      <p v-if="tickets.length === 0" class="text-center text-muted-foreground py-8">Belum ada tiket</p>
    </div>
  </div>
</template>
