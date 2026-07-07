<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import { gsap } from "gsap"
import { useRouter } from "vue-router"
import Button from "@/components/ui/Button.vue"
import { ArrowRight, UserPlus, FileText, Zap, Handshake, Medal, ClipboardCheck, Star } from "@lucide/vue"

const router = useRouter()
const sectionRef = ref(null)
const headerRef = ref(null)
const stepsRef = ref([])
let observer = null
let hasAnimated = false

const steps = [
  { icon: UserPlus, title: "Registrasi", desc: "Daftar sebagai siswa SMK atau UMKM dalam 3 menit", step: "01" },
  { icon: FileText, title: "Skill Test", desc: "Ikuti tes adaptif berbasis AI untuk mengukur kompetensi", step: "02" },
  { icon: Zap, title: "Matchmaking", desc: "Dapatkan rekomendasi kecocokan terbaik dari algoritma cerdas", step: "03" },
  { icon: Handshake, title: "Konfirmasi", desc: "Kedua pihak menyetujui match — magang siap dimulai", step: "04" },
  { icon: Medal, title: "Magang Mikro", desc: "Jalani magang 14 hari dengan bimbingan dan monitoring harian", step: "05" },
  { icon: ClipboardCheck, title: "Evaluasi", desc: "Siswa dan UMKM saling memberi rating serta ulasan", step: "06" },
  { icon: Star, title: "Sertifikat", desc: "Terbitkan sertifikat kompetensi digital terverifikasi", step: "07" },
]

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
        tl.fromTo(headerRef.value, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })
        tl.fromTo(
          stepsRef.value,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.05 },
          "-=0.2",
        )
        observer?.disconnect()
      }
    },
    { threshold: 0.1 },
  )
  if (sectionRef.value) observer.observe(sectionRef.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <section id="how-it-works" ref="sectionRef" class="py-20 md:py-28 border-t border-border">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div ref="headerRef" class="max-w-2xl mx-auto text-center mb-16">
        <p class="text-xs font-semibold tracking-widest uppercase text-accent mb-4">Cara Kerja</p>
        <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
          Dari Registrasi ke Sertifikat Hanya dalam 7 Langkah
        </h2>
        <p class="mt-4 text-base text-muted-foreground/70 max-w-lg mx-auto leading-relaxed">
          Proses sederhana dan transparan — dari pendaftaran hingga sertifikat kompetensi digital.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          v-for="(step, i) in steps"
          :key="i"
          :ref="el => { if (el) stepsRef[i] = el }"
          class="relative p-5 rounded-2xl border border-border bg-white hover:border-accent/20 hover:shadow-md transition-all duration-200"
        >
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 flex flex-col items-center">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/8 text-accent">
                <component :is="step.icon" class="h-4 w-4" />
              </div>
              <div class="mt-2 w-px flex-1 bg-border/50" v-if="i < steps.length - 1" />
            </div>
            <div class="min-w-0">
              <span class="text-[10px] font-bold text-accent/60 tracking-wider">{{ step.step }}</span>
              <h3 class="text-sm font-semibold mt-0.5">{{ step.title }}</h3>
              <p class="text-xs text-muted-foreground/70 mt-1 leading-relaxed">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <div ref="headerRef" class="mt-12 text-center">
        <Button size="lg" class="shadow-lg shadow-accent/20" @click="router.push('/register')">
          Mulai Sekarang
          <ArrowRight class="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  </section>
</template>
