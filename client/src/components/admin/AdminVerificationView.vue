<script setup>
import { ref, onMounted } from "vue"
import Card from "@/components/ui/Card.vue"
import Button from "@/components/ui/Button.vue"
import Badge from "@/components/ui/Badge.vue"
import { api } from "@/lib/api"
import { Building2, Check, XCircle } from "@lucide/vue"

const umkmList = ref([])
const loading = ref(false)
const errorMsg = ref("")

async function loadUmkm() {
  loading.value = true
  errorMsg.value = ""
  try {
    umkmList.value = await api.get("/profiles/umkm")
  } catch (e) {
    errorMsg.value = e.message
  }
  loading.value = false
}

async function verify(profile, isVerified) {
  errorMsg.value = ""
  try {
    await api.patch(`/profiles/umkm/${profile.id}/verify`, { isVerified })
    await loadUmkm()
  } catch (e) {
    errorMsg.value = e.message
  }
}

onMounted(loadUmkm)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Verifikasi UMKM</h1>
      <p class="text-muted-foreground mt-1">Verifikasi akun UMKM agar dapat memasang kebutuhan magang.</p>
    </div>

    <div v-if="errorMsg" class="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
      {{ errorMsg }}
    </div>

    <div class="grid grid-cols-1 gap-4">
      <Card v-for="p in umkmList" :key="p.id" class="p-4">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <Building2 class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-sm">{{ p.businessName }}</h3>
                <Badge :variant="p.isVerified ? 'default' : 'outline'" class="text-[10px]">
                  {{ p.isVerified ? "Terverifikasi" : "Belum" }}
                </Badge>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5">{{ p.fullName }} · {{ p.businessType }} · {{ p.city }}</p>
            </div>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <Button v-if="!p.isVerified" size="sm" @click="verify(p, true)">
              <Check class="h-3.5 w-3.5 mr-1" />Verifikasi
            </Button>
            <Button v-else variant="outline" size="sm" @click="verify(p, false)">
              <XCircle class="h-3.5 w-3.5 mr-1" />Batalkan
            </Button>
          </div>
        </div>
      </Card>
      <p v-if="!loading && umkmList.length === 0" class="text-center text-muted-foreground py-8">Belum ada UMKM</p>
    </div>
  </div>
</template>
