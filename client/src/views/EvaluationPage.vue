<script setup>
import { ref, onMounted } from "vue"
import { useRouter, useRoute } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import Card from "@/components/ui/Card.vue"
import Button from "@/components/ui/Button.vue"
import { api } from "@/lib/api"
import { ArrowLeft, Star, Loader2, Send } from "@lucide/vue"

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const internship = ref(null)
const loading = ref(true)
const saving = ref(false)
const errorMsg = ref("")
const form = ref({ rating: 0, reviewText: "", hoverRating: 0 })

async function load() {
  loading.value = true
  try {
    const res = await api.get(`/internships/list/${route.params.id}`)
    internship.value = res
  } catch (e) {
    errorMsg.value = e.message
  }
  loading.value = false
}

function setRating(v) {
  form.value.rating = v
}

async function submit() {
  if (form.value.rating === 0) return
  saving.value = true
  errorMsg.value = ""
  try {
    await api.post("/evaluations", {
      internshipId: route.params.id,
      rating: form.value.rating,
      reviewText: form.value.reviewText || null,
    })
    router.push(`/internships/${route.params.id}`)
  } catch (e) {
    errorMsg.value = e.message
  }
  saving.value = false
}

onMounted(load)
</script>

<template>
  <div class="max-w-xl mx-auto py-16 px-4">
    <button class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6" @click="router.push(`/internships/${route.params.id}`)">
      <ArrowLeft class="h-4 w-4" /> Kembali
    </button>

    <Card class="p-6">
      <div class="text-center mb-6">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 mx-auto mb-3">
          <Star class="h-7 w-7" />
        </div>
        <h1 class="text-xl font-bold mb-1">Beri Ulasan</h1>
        <p class="text-sm text-muted-foreground">Bagaimana pengalaman magang ini?</p>
      </div>

      <div v-if="errorMsg" class="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive mb-4">
        {{ errorMsg }}
      </div>

      <div class="flex justify-center gap-2 mb-6">
        <button
          v-for="i in 5"
          :key="i"
          class="text-3xl transition-colors"
          :class="(form.hoverRating || form.rating) >= i ? 'text-amber-400' : 'text-gray-200'"
          @mouseenter="form.hoverRating = i"
          @mouseleave="form.hoverRating = 0"
          @click="setRating(i)"
        >
          ★
        </button>
      </div>

      <div class="space-y-1.5 mb-6">
        <label class="text-sm font-medium">Komentar (opsional)</label>
        <textarea v-model="form.reviewText" rows="4" placeholder="Ceritakan pengalaman magang Anda..."
          class="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none" />
      </div>

      <Button class="w-full" :disabled="form.rating === 0 || saving" @click="submit">
        <Loader2 v-if="saving" class="h-4 w-4 mr-2 animate-spin" />
        {{ saving ? "Mengirim..." : "Kirim Ulasan" }}
      </Button>
    </Card>
  </div>
</template>
