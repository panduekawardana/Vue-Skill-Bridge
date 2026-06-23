<script setup>
import { ref, onMounted } from "vue"
import Card from "@/components/ui/Card.vue"
import Badge from "@/components/ui/Badge.vue"
import Button from "@/components/ui/Button.vue"
import { api } from "@/lib/api"
import { Shuffle } from "@lucide/vue"

const matches = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    matches.value = await api.get("/matchmaking")
  } catch {}
  loading.value = false
}

async function forceAccept(match) {
  try {
    await api.post(`/matchmaking/${match.id}/respond`, { response: "accepted" })
    await load()
  } catch {}
}

async function forceReject(match) {
  try {
    await api.post(`/matchmaking/${match.id}/respond`, { response: "rejected" })
    await load()
  } catch {}
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Match Override</h1>
      <p class="text-muted-foreground mt-1">Kelola dan override match antar siswa dan UMKM.</p>
    </div>

    <div class="space-y-3">
      <Card v-for="m in matches" :key="m.id" class="p-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <Badge variant="outline">{{ m.status }}</Badge>
              <span class="text-xs text-muted-foreground">Score: {{ m.matchScore }}</span>
            </div>
            <p class="text-sm font-medium">{{ m.studentName }} → {{ m.needTitle }}</p>
            <p class="text-xs text-muted-foreground">{{ m.businessName }}</p>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <Button v-if="m.status === 'pending'" size="sm" @click="forceAccept(m)">Force Accept</Button>
            <Button v-if="m.status === 'pending'" variant="destructive" size="sm" @click="forceReject(m)">Tolak</Button>
          </div>
        </div>
      </Card>
      <p v-if="!loading && matches.length === 0" class="text-center text-muted-foreground py-8">Belum ada match</p>
    </div>
  </div>
</template>
