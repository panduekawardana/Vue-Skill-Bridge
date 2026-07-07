<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import { gsap } from "gsap"
import { ClipboardCheck, Zap, Building2, BarChart3, Sparkles, Target } from "@lucide/vue"

const sectionRef = ref(null)
const headerRef = ref(null)
const cardsRef = ref([])
let observer = null
let hasAnimated = false

const features = [
  {
    icon: ClipboardCheck,
    title: "Skill Test Adaptif",
    desc: "Tes berbasis AI yang menyesuaikan level kesulitan secara real-time. Hasil terukur dan langsung terpetakan dengan kebutuhan industri.",
    stats: "15 menit selesai",
  },
  {
    icon: Zap,
    title: "Matchmaking Cerdas",
    desc: "Algoritma pencocokan multi-dimensi yang mempertimbangkan kompetensi, minat, dan kebutuhan UMKM secara transparan.",
    stats: "94% akurasi",
  },
  {
    icon: Building2,
    title: "Magang Mikro 14 Hari",
    desc: "Komitmen singkat berdampak nyata. Siswa dapat pengalaman langsung, UMKM mendapat tenaga terverifikasi tanpa biaya besar.",
    stats: "2 minggu durasi",
  },
  {
    icon: BarChart3,
    title: "Monitoring Real-time",
    desc: "Pantau perkembangan magang secara langsung. Laporan harian, evaluasi berkala, dan notifikasi otomatis untuk kedua pihak.",
    stats: "Update harian",
  },
  {
    icon: Sparkles,
    title: "Sertifikat Digital",
    desc: "Sertifikat kompetensi terverifikasi yang diterbitkan otomatis setelah magang selesai. Bisa dipakai di LinkedIn dan portfolio.",
    stats: "BSNP standard",
  },
  {
    icon: Target,
    title: "Evaluasi Berimbang",
    desc: "Siswa dan UMKM saling menilai. Rating publik membangun reputasi dan kepercayaan di ekosistem Skill Bridge.",
    stats: "Rating 4.8/5",
  },
]

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
        tl.fromTo(headerRef.value, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })
        tl.fromTo(
          cardsRef.value,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.06 },
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
  <section id="features" ref="sectionRef" class="py-20 md:py-28">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div ref="headerRef" class="max-w-2xl mx-auto text-center mb-16">
        <p class="text-xs font-semibold tracking-widest uppercase text-accent mb-4">Fitur</p>
        <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
          Semua yang Anda Butuhkan dalam Satu Platform
        </h2>
        <p class="mt-4 text-base text-muted-foreground/70 max-w-lg mx-auto leading-relaxed">
          Dari tes kompetensi hingga sertifikat digital — ekosistem lengkap untuk menjembatani bakat SMK dengan peluang UMKM.
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="(f, i) in features"
          :key="i"
          :ref="el => { if (el) cardsRef[i] = el }"
          class="group relative p-6 rounded-2xl border border-border bg-white hover:border-accent/20 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
        >
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/8 text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300 mb-4">
            <component :is="f.icon" class="h-5 w-5" />
          </div>
          <h3 class="text-base font-semibold mb-2">{{ f.title }}</h3>
          <p class="text-sm text-muted-foreground/70 leading-relaxed">{{ f.desc }}</p>
          <div class="mt-4 pt-4 border-t border-border/50 flex items-center gap-1.5">
            <span class="text-xs font-medium text-accent">{{ f.stats }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
