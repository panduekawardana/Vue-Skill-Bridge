<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import { gsap } from "gsap"
import Card from "@/components/ui/Card.vue"
import { ClipboardCheck, Building2, Zap, FileCheck, RefreshCw, Shield } from "@lucide/vue"

const sectionRef = ref(null)
const cardsRef = ref([])
let observer = null
let hasAnimated = false

const features = [
  {
    icon: ClipboardCheck,
    title: "Skill Test Adaptif",
    desc: "Tes berbasis kompetensi yang menyesuaikan level kemampuan siswa secara real-time.",
  },
  {
    icon: Zap,
    title: "Matchmaking Cerdas",
    desc: "Algoritma mencocokkan hasil tes siswa dengan kebutuhan UMKM untuk hasil paling relevan.",
  },
  {
    icon: Building2,
    title: "Magang Mikro 2 Minggu",
    desc: "Komitmen pendek berdampak nyata. Cocok untuk siswa dan UMKM yang ingin mencoba.",
  },
  {
    icon: FileCheck,
    title: "Sertifikat Kompetensi",
    desc: "Sertifikat digital terverifikasi setelah magang selesai sebagai portofolio resmi.",
  },
  {
    icon: RefreshCw,
    title: "Review Dua Arah",
    desc: "Siswa dan UMKM saling memberi rating dan ulasan untuk transparansi kualitas.",
  },
  {
    icon: Shield,
    title: "Verifikasi Legalitas",
    desc: "Setiap UMKM diverifikasi legalitasnya sebelum dapat memasang kebutuhan magang.",
  },
]

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true
        gsap.fromTo(
          cardsRef.value,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power3.out" },
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
  <section id="features" ref="sectionRef" class="py-20 md:py-28 border-t border-border">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-xl mb-14">
        <p class="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Fitur</p>
        <h2 class="text-3xl md:text-4xl font-bold tracking-tight">Kenapa Skill Bridge?</h2>
        <p class="mt-4 text-muted-foreground max-w-md">
          Platform yang dirancang untuk menjembatani kesenjangan antara pendidikan SMK dan kebutuhan industri.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card
          v-for="(f, i) in features"
          :key="i"
          :ref="el => { if (el) cardsRef[i] = el.$el ?? el }"
          class="p-6 border border-border/60 hover:border-border hover:shadow-sm transition-all duration-200"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 text-primary mb-4">
            <component :is="f.icon" class="h-5 w-5" />
          </div>
          <h3 class="font-semibold mb-1.5">{{ f.title }}</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">{{ f.desc }}</p>
        </Card>
      </div>
    </div>
  </section>
</template>
