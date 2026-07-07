<script setup>
import Card from "@/components/ui/Card.vue"
import { Settings, Shield, Activity } from "@lucide/vue"
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Pengaturan Sistem</h1>
      <p class="text-muted-foreground mt-1">Konfigurasi dan log sistem.</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card class="p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <Shield class="h-5 w-5" />
          </div>
          <div>
            <h3 class="font-semibold">Konfigurasi Algoritma</h3>
            <p class="text-xs text-muted-foreground">Atur parameter matchmaking</p>
          </div>
        </div>
        <p class="text-sm text-muted-foreground">Fitur akan tersedia pada rilis berikutnya.</p>
      </Card>
      <Card class="p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <Activity class="h-5 w-5" />
          </div>
          <div>
            <h3 class="font-semibold">Log Sistem</h3>
            <p class="text-xs text-muted-foreground">Akses dan audit log</p>
          </div>
        </div>
        <p class="text-sm text-muted-foreground">Fitur akan tersedia pada rilis berikutnya.</p>
      </Card>
    </div>
  </div>
</template>
