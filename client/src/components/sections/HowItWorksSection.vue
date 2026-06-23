<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import { gsap } from "gsap"
import { useRouter } from "vue-router"
import Button from "@/components/ui/Button.vue"
import { ArrowRight, UserPlus, FileText, Zap, Handshake, Medal, Star } from "@lucide/vue"

const router = useRouter()
const sectionRef = ref(null)
const stepsRef = ref([])
let observer = null
let hasAnimated = false

const steps = [
  { icon: UserPlus, title: "Registrasi", desc: "Daftar sebagai siswa SMK atau UMKM dalam 3 menit" },
  { icon: FileText, title: "Skill Test", desc: "Ikuti tes adaptif untuk mengukur kompetensimu" },
  { icon: Zap, title: "Match", desc: "Dapatkan rekomendasi kecocokan terbaik" },
  { icon: Handshake, title: "Konfirmasi", desc: "Kedua pihak menyetujui match yang dibuat" },
  { icon: Medal, title: "Magang", desc: "Jalani magang mikro 14 hari dengan bimbingan" },
  { icon: Star, title: "Sertifikat", desc: "Terima sertifikat kompetensi + review" },
]

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true
        gsap.fromTo(
          stepsRef.value,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, stagger: 0.1, ease: "power3.out" },
        )
        observer?.disconnect()
      }
    },
    { threshold: 0.15 },
  )
  if (sectionRef.value) observer.observe(sectionRef.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <section id="how-it-works" ref="sectionRef" class="py-20 md:py-28 bg-secondary/30 border-t border-border">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-xl mb-14">
        <p class="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Cara Kerja</p>
        <h2 class="text-3xl md:text-4xl font-bold tracking-tight">Bagaimana Cara Kerjanya?</h2>
        <p class="mt-4 text-muted-foreground max-w-md">
          Hanya 6 langkah sederhana dari pendaftaran hingga sertifikat.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="(step, i) in steps"
          :key="i"
          :ref="el => { if (el) stepsRef[i] = el }"
          class="flex items-start gap-4 p-5 rounded-xl border border-border/40 bg-white"
        >
          <div class="flex-shrink-0 flex flex-col items-center">
            <div class="flex h-11 w-11 items-center justify-center rounded-full bg-primary/8 text-primary">
              <component :is="step.icon" class="h-5 w-5" />
            </div>
            <div v-if="i < steps.length - 1" class="w-px flex-1 bg-border/60 mt-2" />
          </div>
          <div class="pt-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold text-muted-foreground">0{{ i + 1 }}</span>
              <h3 class="font-semibold">{{ step.title }}</h3>
            </div>
            <p class="text-sm text-muted-foreground leading-relaxed">{{ step.desc }}</p>
          </div>
        </div>
      </div>

      <div class="mt-12">
        <Button size="lg" @click="router.push('/register')">
          Mulai Sekarang
          <ArrowRight class="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  </section>
</template>
