<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import Button from "@/components/ui/Button.vue"
import Card from "@/components/ui/Card.vue"
import { Eye, EyeOff, Loader2, Shield } from "@lucide/vue"

const router = useRouter()
const auth = useAuthStore()

const email = ref("")
const password = ref("")
const showPassword = ref(false)
const errorMsg = ref("")

async function handleLogin() {
  errorMsg.value = ""
  try {
    const res = await auth.login(email.value, password.value)
    if (res.user.role !== "admin") {
      auth.logout()
      errorMsg.value = "Akun ini bukan admin. Silakan gunakan halaman login biasa."
      return
    }
    router.push("/admin/dashboard")
  } catch (e) {
    errorMsg.value = e.message
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div class="flex items-center justify-center gap-2 mb-2">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-sm font-bold text-white">
            <Shield class="h-5 w-5" />
          </div>
          <span class="text-2xl font-bold">Skill Bridge</span>
        </div>
        <p class="text-sm font-semibold text-amber-600">Admin Panel</p>
        <p class="text-sm text-muted-foreground mt-1">Masuk ke dashboard admin</p>
      </div>

      <Card class="p-6">
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium" for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              placeholder="admin@skillbridge.id"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium" for="password">Password</label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="w-full h-10 px-3 pr-10 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="Masukkan password"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4" />
              </button>
            </div>
          </div>

          <p v-if="errorMsg" class="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{{ errorMsg }}</p>

          <Button type="submit" class="w-full" :disabled="auth.loading">
            <Loader2 v-if="auth.loading" class="h-4 w-4 mr-2 animate-spin" />
            {{ auth.loading ? "Memproses..." : "Masuk ke Admin" }}
          </Button>
        </form>

        <div class="mt-6 pt-4 border-t border-border text-center">
          <a href="/login" class="text-xs text-muted-foreground hover:text-foreground">← Kembali ke halaman utama</a>
        </div>
      </Card>
    </div>
  </div>
</template>
