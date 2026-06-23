<script setup>
import Navbar from "@/components/layout/Navbar.vue"
import Footer from "@/components/layout/Footer.vue"
import HeroSection from "@/components/sections/HeroSection.vue"
import FeaturesSection from "@/components/sections/FeaturesSection.vue"
import HowItWorksSection from "@/components/sections/HowItWorksSection.vue"
</script>

<template>
  <Navbar />
  <main>
    <HeroSection />
    <FeaturesSection />
    <HowItWorksSection />
  </main>
  <Footer />
</template>
