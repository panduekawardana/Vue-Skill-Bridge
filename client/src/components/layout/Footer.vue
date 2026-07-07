<script setup>
import { useRouter } from "vue-router"

const router = useRouter()
</script>

<template>
  <footer class="border-t border-border bg-white">
    <div class="mx-auto max-w-7xl px-6 lg:px-8 py-16">
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
        <div class="col-span-2 lg:col-span-2">
          <div class="flex items-center gap-2 mb-4 cursor-pointer" @click="router.push('/')">
            <div class="flex h-7 w-7 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
              SB
            </div>
            <span class="text-base font-semibold">Skill Bridge</span>
          </div>
          <p class="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Platform matchmaking berbasis kompetensi yang menjembatani lulusan SMK dengan UMKM lokal di seluruh Indonesia.
          </p>
          <div class="flex items-center gap-4 mt-5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:bg-accent hover:text-white transition-all cursor-pointer">
              <span class="text-xs font-bold">IG</span>
            </div>
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:bg-accent hover:text-white transition-all cursor-pointer">
              <span class="text-xs font-bold">LI</span>
            </div>
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:bg-accent hover:text-white transition-all cursor-pointer">
              <span class="text-xs font-bold">YT</span>
            </div>
          </div>
        </div>

        <div>
          <h4 class="font-semibold text-sm mb-4">Platform</h4>
          <ul class="space-y-3 text-sm text-muted-foreground">
            <li><a href="#features" class="hover:text-foreground transition-colors">Fitur</a></li>
            <li><a href="#how-it-works" class="hover:text-foreground transition-colors">Cara Kerja</a></li>
            <li><a href="#testimonials" class="hover:text-foreground transition-colors">Testimoni</a></li>
            <li><a href="/register" class="hover:text-foreground transition-colors">Daftar</a></li>
          </ul>
        </div>

        <div>
          <h4 class="font-semibold text-sm mb-4">Untuk Siapa</h4>
          <ul class="space-y-3 text-sm text-muted-foreground">
            <li class="hover:text-foreground transition-colors cursor-pointer">Siswa SMK</li>
            <li class="hover:text-foreground transition-colors cursor-pointer">UMKM Lokal</li>
            <li class="hover:text-foreground transition-colors cursor-pointer">Sekolah</li>
            <li class="hover:text-foreground transition-colors cursor-pointer">Pemerintah Daerah</li>
          </ul>
        </div>

        <div>
          <h4 class="font-semibold text-sm mb-4">Kontak</h4>
          <ul class="space-y-3 text-sm text-muted-foreground">
            <li>hello@skillbridge.id</li>
            <li class="hover:text-foreground transition-colors cursor-pointer">Instagram</li>
            <li class="hover:text-foreground transition-colors cursor-pointer">LinkedIn</li>
            <li class="hover:text-foreground transition-colors cursor-pointer">YouTube</li>
          </ul>
        </div>
      </div>

      <div class="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-xs text-muted-foreground">
          &copy; {{ new Date().getFullYear() }} Skill Bridge. All rights reserved.
        </p>
        <p class="text-xs text-muted-foreground">
          Dibuat untuk menjembatani bakat dan peluang di Indonesia.
        </p>
      </div>
    </div>
  </footer>
</template>
