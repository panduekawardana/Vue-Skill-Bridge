<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import Button from "@/components/ui/Button.vue"
import { Menu, X, LogOut } from "@lucide/vue"

const router = useRouter()
const auth = useAuthStore()
const isOpen = ref(false)
const isScrolled = ref(false)

function handleScroll() {
  isScrolled.value = window.scrollY > 10
}

function handleLogout() {
  auth.logout()
  router.push("/")
}

onMounted(() => window.addEventListener("scroll", handleScroll))
onUnmounted(() => window.removeEventListener("scroll", handleScroll))
</script>

<template>
  <header
    :class="[
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-border shadow-xs' : 'bg-transparent',
    ]"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            SB
          </div>
          <span class="text-lg font-bold">Skill Bridge</span>
        </div>

        <nav class="hidden md:flex items-center gap-6">
          <a href="#features" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Fitur</a>
          <a href="#how-it-works" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Cara Kerja</a>
        </nav>

        <div v-if="auth.isAuthenticated" class="hidden md:flex items-center gap-3">
          <span class="text-sm text-muted-foreground">{{ auth.user?.fullName }}</span>
          <Button variant="ghost" size="sm" @click="handleLogout">
            <LogOut class="h-4 w-4 mr-1.5" />
            Keluar
          </Button>
        </div>
        <div v-else class="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" @click="router.push('/login')">Masuk</Button>
          <Button size="sm" @click="router.push('/register')">Daftar</Button>
        </div>

        <button class="md:hidden p-2" @click="isOpen = !isOpen">
          <Menu v-if="!isOpen" class="h-5 w-5" />
          <X v-else class="h-5 w-5" />
        </button>
      </div>

      <div v-if="isOpen" class="md:hidden border-t border-border py-4 space-y-3">
        <a href="#features" class="block text-sm text-muted-foreground hover:text-foreground" @click="isOpen = false">Fitur</a>
        <a href="#how-it-works" class="block text-sm text-muted-foreground hover:text-foreground" @click="isOpen = false">Cara Kerja</a>
        <div v-if="auth.isAuthenticated" class="pt-2 space-y-2">
          <p class="text-sm text-muted-foreground px-1">{{ auth.user?.fullName }}</p>
          <Button variant="outline" size="sm" class="w-full" @click="handleLogout">Keluar</Button>
        </div>
        <div v-else class="flex gap-2 pt-2">
          <Button variant="outline" size="sm" class="flex-1" @click="router.push('/login')">Masuk</Button>
          <Button size="sm" class="flex-1" @click="router.push('/register')">Daftar</Button>
        </div>
      </div>
    </div>
  </header>
</template>
