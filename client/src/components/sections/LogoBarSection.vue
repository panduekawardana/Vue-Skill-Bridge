<script setup>
import { Building2, GraduationCap, Store, BookOpen, Landmark } from "@lucide/vue"
</script>

<template>
  <section class="py-14 border-t border-border bg-secondary/20">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <p class="text-sm font-medium text-center text-muted-foreground mb-8">
        Dipercaya oleh 500+ institusi pendidikan & UMKM di seluruh Indonesia
      </p>
      <div class="flex flex-wrap items-center justify-center gap-x-14 gap-y-8">
        <div class="flex items-center gap-2.5 text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5">
            <GraduationCap class="h-4 w-4" />
          </div>
          <span class="text-sm font-semibold">SMKN 1 Jakarta</span>
        </div>
        <div class="flex items-center gap-2.5 text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5">
            <Building2 class="h-4 w-4" />
          </div>
          <span class="text-sm font-semibold">Disnaker Jabar</span>
        </div>
        <div class="flex items-center gap-2.5 text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5">
            <Store class="h-4 w-4" />
          </div>
          <span class="text-sm font-semibold">Kadin Indonesia</span>
        </div>
        <div class="flex items-center gap-2.5 text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5">
            <BookOpen class="h-4 w-4" />
          </div>
          <span class="text-sm font-semibold">SMKN 2 Surabaya</span>
        </div>
        <div class="flex items-center gap-2.5 text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5">
            <Landmark class="h-4 w-4" />
          </div>
          <span class="text-sm font-semibold">Kemendikbud</span>
        </div>
      </div>
    </div>
  </section>
</template>
