<script setup>
import { useRouter } from "vue-router"
import Button from "@/components/ui/Button.vue"
import { ArrowRight, Mail } from "@lucide/vue"

const router = useRouter()
</script>

<template>
  <section class="relative py-24 md:py-28 overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-accent via-accent/90 to-accent" />
    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_60%)]"
    />

    <div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 text-center">
      <div class="max-w-2xl mx-auto">
        <div class="flex justify-center mb-6">
          <div class="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10">
            <Mail class="h-3.5 w-3.5" />
            Mulai perjalananmu
          </div>
        </div>

        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.1]">
          Siap Menjembatani Bakat dan Peluang?
        </h2>

        <p class="mt-4 text-base sm:text-lg text-white/60 max-w-md mx-auto leading-relaxed">
          Bergabunglah dengan ribuan siswa SMK dan UMKM yang telah menemukan kecocokan sempurna melalui Skill Bridge.
        </p>

        <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            class="bg-white text-accent hover:bg-white/90 shadow-xl shadow-black/10"
            @click="router.push('/register')"
          >
            Daftar Gratis
            <ArrowRight class="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            class="border-white/20 text-white hover:bg-white/10 hover:border-white/30"
            @click="router.push('/login')"
          >
            Masuk
          </Button>
        </div>
      </div>
    </div>
  </section>
</template>
