<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { gsap } from "gsap"
import Button from "@/components/ui/Button.vue"
import { ArrowRight, Zap, Shield, Users } from "@lucide/vue"

const router = useRouter()

const badgeRef = ref(null)
const headlineRef = ref(null)
const descRef = ref(null)
const actionsRef = ref(null)
const visualRef = ref(null)
const statItems = ref([])

onMounted(() => {
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

  tl.fromTo(badgeRef.value, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 })

  if (headlineRef.value?.children) {
    Array.from(headlineRef.value.children).forEach((el) => {
      tl.fromTo(el, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.1")
    })
  }

  tl.fromTo(descRef.value, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "-=0.15")
    .fromTo(actionsRef.value, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "-=0.1")
    .fromTo(visualRef.value, { y: 30, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }, "-=0.2")

  if (statItems.value.length) {
    tl.fromTo(statItems.value, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.06 }, "-=0.1")
  }
})
</script>

<template>
  <section class="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-b from-accent/[0.02] via-transparent to-transparent pointer-events-none" />

    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
        <div class="max-w-xl">
          <div
            ref="badgeRef"
            class="inline-flex items-center gap-1.5 bg-accent/8 text-accent text-xs font-semibold px-3 py-1.5 rounded-full border border-accent/15 mb-6"
          >
            <Zap class="h-3.5 w-3.5" />
            Platform Matchmaking #1 di Indonesia
          </div>

          <h1 ref="headlineRef" class="text-4xl sm:text-5xl lg:text-6xl/tight font-bold tracking-tight">
            <span class="block">Jembatani Bakat</span>
            <span class="block text-accent">SMK dengan Peluang</span>
            <span class="block">UMKM Lokal</span>
          </h1>

          <p ref="descRef" class="mt-5 text-base sm:text-lg text-muted-foreground/80 leading-relaxed max-w-md">
            Platform matchmaking berbasis kompetensi yang mempertemukan lulusan SMK terverifikasi dengan UMKM lokal untuk magang mikro 14 hari.
          </p>

          <div ref="actionsRef" class="mt-8 flex flex-col sm:flex-row gap-3">
            <Button size="lg" class="shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/25 transition-all duration-300" @click="router.push('/register')">
              Mulai Gratis
              <ArrowRight class="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" @click="router.push('/login')">
              Lihat Demo
            </Button>
          </div>

          <div ref="statItems" class="mt-10 flex items-center gap-8">
            <div>
              <p class="text-2xl font-bold">94%</p>
              <p class="text-xs text-muted-foreground">Match Rate</p>
            </div>
            <div class="w-px h-8 bg-border" />
            <div>
              <p class="text-2xl font-bold">500+</p>
              <p class="text-xs text-muted-foreground">Penempatan</p>
            </div>
            <div class="w-px h-8 bg-border" />
            <div>
              <p class="text-2xl font-bold">100%</p>
              <p class="text-xs text-muted-foreground">Gratis</p>
            </div>
          </div>
        </div>

        <div ref="visualRef" class="relative hidden lg:block">
          <div class="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/5 border border-border">
            <img
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=700&h=550&fit=crop"
              alt="Kolaborasi siswa SMK dan UMKM"
              class="w-full h-[480px] object-cover"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-transparent" />
          </div>

          <div class="absolute -bottom-4 -right-4 rounded-xl border border-border bg-white px-5 py-3 shadow-xl shadow-black/5">
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                <Shield class="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p class="text-sm font-semibold">Kompetensi Terverifikasi</p>
                <p class="text-xs text-muted-foreground">Standar BNSP</p>
              </div>
            </div>
          </div>

          <div class="absolute -top-4 -left-4 rounded-xl border border-border bg-white px-5 py-3 shadow-xl shadow-black/5">
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                <Users class="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p class="text-sm font-semibold">50+ UMKM Aktif</p>
                <p class="text-xs text-muted-foreground">Tersebar di 15 kota</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
