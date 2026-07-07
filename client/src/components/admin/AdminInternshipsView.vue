<script setup>
import { ref, onMounted } from "vue"
import Card from "@/components/ui/Card.vue"
import Badge from "@/components/ui/Badge.vue"
import Button from "@/components/ui/Button.vue"
import { api } from "@/lib/api"
import { Briefcase, Eye } from "@lucide/vue"
import { useRouter } from "vue-router"

const router = useRouter()
const internships = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    internships.value = await api.get("/internships/list")
  } catch {}
  loading.value = false
}

const statusColor = { scheduled: "outline", active: "default", completed: "secondary", cancelled: "destructive" }

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Monitoring Magang</h1>
      <p class="text-muted-foreground mt-1">Pantau semua magang berjalan.</p>
    </div>

    <div class="space-y-3">
      <Card v-for="m in internships" :key="m.id" class="p-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <Badge :variant="statusColor[m.status] || 'outline'">{{ m.status }}</Badge>
              <span class="text-xs text-muted-foreground">{{ m.startDate }} — {{ m.endDate }}</span>
            </div>
            <p class="text-sm font-medium">{{ m.studentName || "—" }} @ {{ m.businessName || "—" }}</p>
          </div>
          <Button variant="ghost" size="sm" @click="router.push(`/internships/${m.id}`)"><Eye class="h-4 w-4" /></Button>
        </div>
      </Card>
      <p v-if="!loading && internships.length === 0" class="text-center text-muted-foreground py-8">Belum ada magang</p>
    </div>
  </div>
</template>
