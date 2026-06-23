<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import Button from "@/components/ui/Button.vue"
import Card from "@/components/ui/Card.vue"
import { Eye, EyeOff, Loader2 } from "@lucide/vue"

const router = useRouter()
const auth = useAuthStore()

const fullName = ref("")
const email = ref("")
const phone = ref("")
const password = ref("")
const role = ref("student")
const showPassword = ref(false)
const errorMsg = ref("")

async function handleRegister() {
  errorMsg.value = ""
  try {
    await auth.register({
      fullName: fullName.value,
      email: email.value,
      phone: phone.value,
      password: password.value,
      role: role.value,
    })
    router.push("/dashboard")
  } catch (e) {
    errorMsg.value = e.message
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div class="flex items-center justify-center gap-2 mb-2">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            SB
          </div>
          <span class="text-2xl font-bold">Skill Bridge</span>
        </div>
        <p class="text-sm text-muted-foreground">Buat akun baru</p>
      </div>

      <Card class="p-6">
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium" for="name">Nama Lengkap</label>
            <input
              id="name"
              v-model="fullName"
              type="text"
              required
              class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="John Doe"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium" for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="nama@email.com"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium" for="phone">No. Telepon</label>
            <input
              id="phone"
              v-model="phone"
              type="tel"
              required
              class="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="08123456789"
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
                minlength="6"
                class="w-full h-10 px-3 pr-10 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Min. 6 karakter"
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

          <div class="space-y-2">
            <label class="text-sm font-medium">Daftar Sebagai</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                :class="[
                  'h-10 rounded-lg border text-sm font-medium transition-colors',
                  role === 'student'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50',
                ]"
                @click="role = 'student'"
              >
                Siswa SMK
              </button>
              <button
                type="button"
                :class="[
                  'h-10 rounded-lg border text-sm font-medium transition-colors',
                  role === 'umkm'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50',
                ]"
                @click="role = 'umkm'"
              >
                UMKM
              </button>
            </div>
          </div>

          <p v-if="errorMsg" class="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{{ errorMsg }}</p>

          <Button type="submit" class="w-full" :disabled="auth.loading">
            <Loader2 v-if="auth.loading" class="h-4 w-4 mr-2 animate-spin" />
            {{ auth.loading ? "Memproses..." : "Daftar" }}
          </Button>
        </form>

        <p class="mt-4 text-center text-sm text-muted-foreground">
          Sudah punya akun?
          <a href="/login" class="text-primary hover:underline font-medium" @click.prevent="router.push('/login')">Masuk</a>
        </p>
      </Card>
    </div>
  </div>
</template>
