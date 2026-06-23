<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { gsap } from "gsap"
import Button from "@/components/ui/Button.vue"
import Badge from "@/components/ui/Badge.vue"
import { ArrowRight, Sparkles, Users, Building2, Star } from "@lucide/vue"

const router = useRouter()

const badgeRef = ref(null)
const linesRef = ref(null)
const descRef = ref(null)
const actionsRef = ref(null)
const statsRef = ref(null)
const visualRef = ref(null)
const orbRef = ref(null)
const floatingCardsRef = ref([])

onMounted(() => {
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

  tl.fromTo(badgeRef.value, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })

  if (linesRef.value?.children) {
    Array.from(linesRef.value.children).forEach((el) => {
      tl.fromTo(el, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.25")
    })
  }

  tl.fromTo(descRef.value, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.2")
    .fromTo(actionsRef.value, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.15")
    .fromTo(statsRef.value?.children ?? [], { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.08 }, "-=0.1")

  if (visualRef.value) {
    tl.fromTo(visualRef.value, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "power2.out" }, "-=0.1")
  }

  floatingCardsRef.value.forEach((el) => {
    tl.fromTo(el, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, "-=0.3")
  })

  if (orbRef.value) {
    gsap.to(orbRef.value, {
      scale: 1.05,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    })
  }
})
</script>

<template>
  <section class="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden min-h-screen flex items-center">
    <div class="absolute inset-0 -z-10 pointer-events-none">
      <div class="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-gradient-to-br from-primary/8 via-accent/5 to-transparent rounded-full blur-3xl" />
      <div class="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-gradient-to-tr from-accent/8 via-primary/5 to-transparent rounded-full blur-3xl" />
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/[0.02] via-transparent to-transparent" />
    </div>

    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
      <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div class="flex flex-col max-w-xl">
          <div ref="badgeRef" class="mb-6">
            <Badge variant="secondary" class="inline-flex items-center gap-1.5 text-xs tracking-wide uppercase font-semibold px-3 py-1.5">
              <Sparkles class="h-3 w-3 text-primary" />
              Platform Matchmaking Magang Mikro
            </Badge>
          </div>

          <h1 ref="linesRef" class="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.1]">
            <span class="block">Jembatani Bakat SMK</span>
            <span class="block mt-1 bg-gradient-to-r from-primary via-accent to-accent bg-clip-text text-transparent">
              dengan Kebutuhan UMKM
            </span>
          </h1>

          <div ref="descRef" class="mt-6">
            <p class="text-base sm:text-lg text-muted-foreground/90 leading-relaxed max-w-lg">
              Platform berbasis kompetensi yang mempertemukan lulusan SMK dengan UMKM lokal
              untuk magang mikro 2 minggu. Terverifikasi, terukur, dan saling menguntungkan.
            </p>
          </div>

          <div ref="actionsRef" class="mt-8 flex flex-col sm:flex-row gap-3">
            <Button size="lg" class="group shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all duration-300" @click="router.push('/register')">
              Daftar Sekarang
              <ArrowRight class="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Button>
            <Button variant="outline" size="lg" class="hover:border-primary/30 transition-all duration-300" @click="router.push('/login')">
              Sudah Punya Akun?
            </Button>
          </div>

          <div ref="statsRef" class="mt-12 flex gap-4 sm:gap-6">
            <div class="flex items-center gap-3 rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm px-4 py-3 shadow-xs">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 text-primary shrink-0">
                <Users class="h-4 w-4" />
              </div>
              <div>
                <p class="text-sm font-bold text-foreground">2 Minggu</p>
                <p class="text-[11px] text-muted-foreground">Durasi Magang</p>
              </div>
            </div>
            <div class="flex items-center gap-3 rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm px-4 py-3 shadow-xs">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/8 text-accent shrink-0">
                <Star class="h-4 w-4" />
              </div>
              <div>
                <p class="text-sm font-bold text-foreground">100%</p>
                <p class="text-[11px] text-muted-foreground">Berbasis Skill</p>
              </div>
            </div>
            <div class="flex items-center gap-3 rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm px-4 py-3 shadow-xs">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/8 text-emerald-500 shrink-0">
                <Building2 class="h-4 w-4" />
              </div>
              <div>
                <p class="text-sm font-bold text-foreground">Gratis</p>
                <p class="text-[11px] text-muted-foreground">Tanpa Biaya</p>
              </div>
            </div>
          </div>
        </div>

        <div ref="visualRef" class="relative hidden lg:flex items-center justify-center">
          <div ref="orbRef" class="absolute w-[500px] h-[500px] bg-gradient-to-br from-primary/10 via-accent/10 to-transparent rounded-full blur-2xl" />

          <div class="relative flex flex-col items-center gap-4">
            <div ref="floatingCardsRef" class="relative w-72 rounded-2xl border border-border/60 bg-background/70 backdrop-blur-md p-5 shadow-lg shadow-primary/5">
              <div class="flex items-center gap-3 mb-4">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white text-xs font-bold shadow-md">
                  SMK
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold truncate">Andi Pratama</p>
                  <p class="text-xs text-muted-foreground">Rekayasa Perangkat Lunak</p>
                </div>
                <div class="flex h-6 items-center rounded-full bg-emerald-500/10 px-2 text-[10px] font-medium text-emerald-600">
                  Skor 94
                </div>
              </div>
              <div class="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div class="h-full w-[94%] rounded-full bg-gradient-to-r from-primary to-accent" />
              </div>
              <div class="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <span>Skill Match</span>
                <span class="font-semibold text-foreground">Sangat Tinggi</span>
              </div>
            </div>

            <div ref="floatingCardsRef" class="relative w-72 rounded-2xl border border-border/60 bg-background/70 backdrop-blur-md p-5 shadow-lg shadow-accent/5 -ml-16">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary text-white text-xs font-bold shadow-md">
                  UMKM
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold truncate">Warung Makan Sejahtera</p>
                  <p class="text-xs text-muted-foreground">Membutuhkan: Admin Digital</p>
                </div>
              </div>
              <div class="mt-3 flex gap-1.5 flex-wrap">
                <span class="rounded-full bg-secondary text-secondary-foreground px-2.5 py-0.5 text-[10px] font-medium">Manajemen Data</span>
                <span class="rounded-full bg-secondary text-secondary-foreground px-2.5 py-0.5 text-[10px] font-medium">Media Sosial</span>
                <span class="rounded-full bg-secondary text-secondary-foreground px-2.5 py-0.5 text-[10px] font-medium">Excel</span>
              </div>
            </div>

            <div class="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 mt-2">
              <div class="h-px w-12 bg-border" />
              <span class="inline-flex items-center gap-1">
                <Sparkles class="h-3 w-3 text-primary/60" />
                Matchmaking otomatis berbasis AI
              </span>
              <div class="h-px w-12 bg-border" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
