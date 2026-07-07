<script setup>
import { computed } from "vue"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const props = defineProps({
  variant: { type: String, default: "default" },
  size: { type: String, default: "default" },
  as: { type: String, default: "button" },
  to: { type: [String, Object], default: null },
})

const isLink = computed(() => !!props.to)

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-background hover:bg-secondary",
        ghost: "hover:bg-secondary",
        link: "text-accent underline-offset-4 hover:underline",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-xs",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)
</script>

<template>
  <component
    :is="isLink ? 'RouterLink' : as"
    :to="isLink ? to : undefined"
    v-bind="isLink ? {} : $attrs"
    :class="cn(buttonVariants({ variant, size }), $attrs.class ?? '')"
  >
    <slot />
  </component>
</template>
