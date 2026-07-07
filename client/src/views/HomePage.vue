<script setup>
import Navbar from "@/components/layout/Navbar.vue"
import Footer from "@/components/layout/Footer.vue"
import HeroSection from "@/components/sections/HeroSection.vue"
import LogoBarSection from "@/components/sections/LogoBarSection.vue"
import FeaturesSection from "@/components/sections/FeaturesSection.vue"
import TestimonialsSection from "@/components/sections/TestimonialsSection.vue"
import HowItWorksSection from "@/components/sections/HowItWorksSection.vue"
import CtaSection from "@/components/sections/CtaSection.vue"
</script>

<template>
  <Navbar />
  <main>
    <HeroSection />
    <LogoBarSection />
    <FeaturesSection />
    <TestimonialsSection />
    <HowItWorksSection />
    <CtaSection />
  </main>
  <Footer />
</template>
