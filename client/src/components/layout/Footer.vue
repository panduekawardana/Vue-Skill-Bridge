<script setup>
import { useRouter } from "vue-router"

const router = useRouter()
</script>

<template>
  <footer class="border-t border-border bg-secondary/30">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="md:col-span-2">
          <div class="flex items-center gap-2 mb-3 cursor-pointer" @click="router.push('/')">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              SB
            </div>
            <span class="text-lg font-bold">Skill Bridge</span>
          </div>
          <p class="text-sm text-muted-foreground max-w-sm">
            Menjembatani lulusan SMK dengan UMKM lokal melalui magang mikro 2 minggu berbasis kompetensi.
          </p>
        </div>

        <div>
          <h4 class="font-semibold text-sm mb-3">Platform</h4>
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li><a href="#features" class="hover:text-foreground transition-colors">Fitur</a></li>
            <li><a href="#how-it-works" class="hover:text-foreground transition-colors">Cara Kerja</a></li>
          </ul>
        </div>

        <div>
          <h4 class="font-semibold text-sm mb-3">Kontak</h4>
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li>hello@skillbridge.id</li>
            <li>Instagram</li>
            <li>LinkedIn</li>
          </ul>
        </div>
      </div>

      <div class="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        &copy; {{ new Date().getFullYear() }} Skill Bridge. All rights reserved.
      </div>
    </div>
  </footer>
</template>
