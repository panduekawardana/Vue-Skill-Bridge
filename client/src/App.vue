<script setup>
import { onMounted } from "vue"
import { useAuthStore } from "@/stores/auth"

const auth = useAuthStore()

onMounted(() => {
  if (auth.token) {
    auth.fetchProfile()
  }
})
</script>

<template>
  <router-view />
</template>
