<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import { gsap } from "gsap"
import { Quote, Star } from "@lucide/vue"

const sectionRef = ref(null)
const headerRef = ref(null)
const cardsRef = ref([])
let observer = null
let hasAnimated = false

const testimonials = [
  {
    name: "Ahmad Fauzi",
    role: "Kepala SMKN 1 Jakarta",
    quote: "Skill Bridge membantu siswa kami mendapatkan pengalaman kerja nyata sebelum lulus. Matchmaking-nya sangat akurat sesuai jurusan.",
    stars: 5,
    source: "Sekolah",
  },
  {
    name: "Rina Wijaya",
    role: "Pemilik Warung Makan Sari Rasa",
    quote: "Magang mikro 14 hari sangat membantu UMKM seperti kami. Tenaga terverifikasi tanpa biaya besar. Sudah 3 kali pakai dan puas.",
    stars: 5,
    source: "UMKM",
  },
  {
    name: "Dimas Prasetyo",
    role: "Siswa SMKN 2 Surabaya",
    quote: "Tes adaptifnya bikin saya tahu persis kompetensi saya. Dapat match dengan UMKM yang cocok dan sekarang dapat sertifikat digital.",
    stars: 5,
    source: "Siswa",
  },
  {
    name: "Bambang Setiawan",
    role: "Ketua Kadin Indonesia Bidang Vokasi",
    quote: "Platform ini menjawab kesenjangan antara SMK dan industri. Pendekatan berbasis kompetensi adalah langkah yang tepat.",
    stars: 5,
    source: "Mitra",
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
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.08 },
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
  <section id="testimonials" ref="sectionRef" class="py-20 md:py-28 bg-secondary/20 border-t border-border">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div ref="headerRef" class="max-w-2xl mx-auto text-center mb-16">
        <p class="text-xs font-semibold tracking-widest uppercase text-accent mb-4">Testimoni</p>
        <h2 class="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
          Dipercaya oleh Ribuan Pengguna
        </h2>
        <p class="mt-4 text-base text-muted-foreground/70 max-w-lg mx-auto leading-relaxed">
          Lihat apa kata sekolah, UMKM, dan siswa yang telah merasakan manfaat Skill Bridge.
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-5">
        <div
          v-for="(t, i) in testimonials"
          :key="i"
          :ref="el => { if (el) cardsRef[i] = el }"
          class="p-6 rounded-2xl border border-border bg-white hover:shadow-md transition-all duration-200"
        >
          <Quote class="h-6 w-6 text-accent/30 mb-3" />
          <p class="text-sm text-foreground/80 leading-relaxed mb-4">"{{ t.quote }}"</p>
          <div class="flex items-center gap-1 mb-3">
            <Star
              v-for="s in t.stars"
              :key="s"
              class="h-3.5 w-3.5 fill-amber-400 text-amber-400"
            />
          </div>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold">{{ t.name }}</p>
              <p class="text-xs text-muted-foreground">{{ t.role }}</p>
            </div>
            <span class="text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/5 px-2.5 py-1 rounded-full">
              {{ t.source }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
