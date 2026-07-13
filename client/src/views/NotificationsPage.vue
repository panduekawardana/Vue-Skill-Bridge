<script setup>
import { ref, onMounted } from "vue"
import { useNotificationStore } from "@/stores/notification"
import DashboardLayout from "@/components/layout/DashboardLayout.vue"
import Card from "@/components/ui/Card.vue"
import Button from "@/components/ui/Button.vue"
import Badge from "@/components/ui/Badge.vue"
import { Bell, CheckCheck, Loader2 } from "@lucide/vue"

const notif = useNotificationStore()
const loading = ref(false)
const activeFilter = ref("all")

const filtered = ref([])

function applyFilter() {
  if (activeFilter.value === "all") {
    filtered.value = notif.items
  } else if (activeFilter.value === "unread") {
    filtered.value = notif.items.filter((n) => !n.isRead)
  } else {
    filtered.value = notif.items.filter((n) => n.type === activeFilter.value)
  }
}

function setFilter(filter) {
  activeFilter.value = filter
  applyFilter()
}

function formatDate(dateStr) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return "baru saja"
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

const typeLabel = {
  match: "Match",
  schedule: "Jadwal",
  evaluation: "Ulasan",
  certificate: "Sertifikat",
  system: "Sistem",
}

const typeColor = {
  match: "bg-blue-100 text-blue-700",
  schedule: "bg-amber-100 text-amber-700",
  evaluation: "bg-purple-100 text-purple-700",
  certificate: "bg-emerald-100 text-emerald-700",
  system: "bg-gray-100 text-gray-700",
}

const filters = [
  { key: "all", label: "Semua" },
  { key: "unread", label: "Belum Dibaca" },
  { key: "match", label: "Match" },
  { key: "schedule", label: "Jadwal" },
  { key: "evaluation", label: "Ulasan" },
  { key: "certificate", label: "Sertifikat" },
  { key: "system", label: "Sistem" },
]

async function load() {
  loading.value = true
  await notif.fetchNotifications(100)
  applyFilter()
  loading.value = false
}

onMounted(load)
</script>

<template>
  <DashboardLayout title="Notifikasi">
    <div class="max-w-3xl">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold">Notifikasi</h1>
          <p class="text-sm text-muted-foreground mt-0.5">
            {{ notif.items.length }} total · {{ notif.unreadCount }} belum dibaca
          </p>
        </div>
        <Button v-if="notif.unreadCount > 0" variant="outline" size="sm" @click="notif.markAllRead()">
          <CheckCheck class="h-3.5 w-3.5 mr-1" /> Tandai Semua Dibaca
        </Button>
      </div>

      <div class="flex flex-wrap gap-2 mb-6">
        <button
          v-for="f in filters"
          :key="f.key"
          :class="[
            'h-8 px-3 rounded-lg text-xs font-medium transition-colors',
            activeFilter === f.key
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground',
          ]"
          @click="setFilter(f.key)"
        >
          {{ f.label }}
        </button>
      </div>

      <div v-if="loading" class="text-center py-16 text-muted-foreground">
        <Loader2 class="h-6 w-6 mx-auto mb-2 animate-spin" />
        Memuat...
      </div>

      <div v-else-if="filtered.length === 0" class="text-center py-16">
        <Bell class="h-10 w-10 mx-auto mb-3 opacity-30 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">Tidak ada notifikasi</p>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="n in filtered"
          :key="n.id"
          :class="[
            'rounded-xl border p-4 transition-colors cursor-pointer',
            !n.isRead ? 'border-primary/20 bg-primary/5' : 'border-border bg-white',
          ]"
          @click="notif.markRead(n.id)"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
              :class="typeColor[n.type] || 'bg-gray-100 text-gray-700'"
            >
              <Bell class="h-4 w-4" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h3 class="text-sm font-medium" :class="!n.isRead ? 'text-foreground' : 'text-muted-foreground'">
                    {{ n.title }}
                  </h3>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ n.body }}</p>
                </div>
                <div class="flex flex-col items-end gap-1 flex-shrink-0">
                  <Badge :variant="n.type === 'match' ? 'default' : 'outline'" class="text-[9px]">
                    {{ typeLabel[n.type] || n.type }}
                  </Badge>
                  <span v-if="!n.isRead" class="h-2 w-2 rounded-full bg-primary" />
                </div>
              </div>
              <p class="text-[10px] text-muted-foreground/60 mt-1.5">{{ formatDate(n.createdAt) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
