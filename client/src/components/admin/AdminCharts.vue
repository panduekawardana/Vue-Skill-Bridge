<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue"
import { Bar, Doughnut } from "vue-chartjs"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import Card from "@/components/ui/Card.vue"
import Button from "@/components/ui/Button.vue"
import { api } from "@/lib/api"
import { BarChart3, RefreshCw, Calendar } from "@lucide/vue"

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const props = defineProps({
  refreshKey: { type: Number, default: 0 },
})

const period = ref("30d")
const raw = ref(null)
const loading = ref(true)

const periods = [
  { value: "7d", label: "7 Hari" },
  { value: "30d", label: "30 Hari" },
  { value: "90d", label: "90 Hari" },
  { value: "all", label: "Semua" },
]

async function load() {
  loading.value = true
  try {
    raw.value = await api.get(`/admin/charts?period=${period.value}`)
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

watch(period, load)

watch(() => props.refreshKey, load)

onMounted(load)

function processRegistrations(data) {
  if (!data) return { labels: [], datasets: [] }
  const regs = data.registrations || []
  const dateSet = new Set()
  const studentMap = {}
  const umkmMap = {}
  for (const r of regs) {
    dateSet.add(r.date)
    if (r.role === "student") studentMap[r.date] = r.count
    else if (r.role === "umkm") umkmMap[r.date] = r.count
  }
  const labels = [...dateSet].sort()
  return {
    labels,
    datasets: [
      {
        label: "Siswa",
        backgroundColor: "#3b82f6",
        data: labels.map(d => studentMap[d] || 0),
      },
      {
        label: "UMKM",
        backgroundColor: "#8b5cf6",
        data: labels.map(d => umkmMap[d] || 0),
      },
    ],
  }
}

function processInternshipStatus(data) {
  if (!data) return { labels: [], datasets: [] }
  const items = data.internshipStatuses || []
  const colorMap = {
    scheduled: "#f59e0b",
    active: "#10b981",
    completed: "#6366f1",
    cancelled: "#ef4444",
  }
  return {
    labels: items.map(i => i.status),
    datasets: [
      {
        data: items.map(i => i.count),
        backgroundColor: items.map(i => colorMap[i.status] || "#94a3b8"),
        borderWidth: 0,
      },
    ],
  }
}

function processMatchStatus(data) {
  if (!data) return { labels: [], datasets: [] }
  const items = data.matchStatuses || []
  const colorMap = {
    pending: "#f59e0b",
    accepted: "#10b981",
    rejected: "#ef4444",
    expired: "#94a3b8",
  }
  return {
    labels: items.map(i => i.status),
    datasets: [
      {
        data: items.map(i => i.count),
        backgroundColor: items.map(i => colorMap[i.status] || "#94a3b8"),
        borderWidth: 0,
      },
    ],
  }
}

const barChartData = computed(() => processRegistrations(raw.value))
const doughnutIntData = computed(() => processInternshipStatus(raw.value))
const doughnutMatchData = computed(() => processMatchStatus(raw.value))

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "top", labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
    tooltip: { bodyFont: { size: 12 } },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: { beginAtZero: true, ticks: { font: { size: 10 }, stepSize: 1 } },
  },
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "bottom", labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
    tooltip: { bodyFont: { size: 12 } },
  },
}
</script>

<template>
  <Card class="p-6">
    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center gap-2">
        <BarChart3 class="h-5 w-5 text-muted-foreground" />
        <h2 class="font-semibold">Grafik & Statistik</h2>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex rounded-lg border border-border overflow-hidden">
          <button
            v-for="p in periods" :key="p.value"
            class="px-3 py-1.5 text-xs font-medium transition-colors"
            :class="period === p.value ? 'bg-amber-500 text-white' : 'text-muted-foreground hover:bg-secondary/50'"
            @click="period = p.value"
          >
            {{ p.label }}
          </button>
        </div>
        <button class="p-1.5 text-muted-foreground hover:text-foreground" @click="load" :disabled="loading">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-16 text-muted-foreground text-sm">Memuat grafik...</div>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Registration bar chart -->
        <div class="lg:col-span-2">
          <p class="text-sm font-medium mb-3">Registrasi Pengguna</p>
          <div class="h-64">
            <Bar v-if="barChartData.labels.length" :data="barChartData" :options="barOptions" />
            <div v-else class="h-full flex items-center justify-center text-muted-foreground text-xs">Belum ada data</div>
          </div>
        </div>

        <!-- Internship status doughnut -->
        <div>
          <p class="text-sm font-medium mb-3">Status Magang</p>
          <div class="h-64 flex items-center justify-center">
            <Doughnut v-if="doughnutIntData.labels.length" :data="doughnutIntData" :options="doughnutOptions" />
            <div v-else class="text-muted-foreground text-xs">Belum ada data</div>
          </div>
        </div>
      </div>

      <!-- Match status doughnut -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <p class="text-sm font-medium mb-3">Status Match</p>
          <div class="h-56 flex items-center justify-center">
            <Doughnut v-if="doughnutMatchData.labels.length" :data="doughnutMatchData" :options="doughnutOptions" />
            <div v-else class="text-muted-foreground text-xs">Belum ada data</div>
          </div>
        </div>
        <div class="sm:col-span-2 flex items-center justify-center text-muted-foreground">
          <Calendar class="h-5 w-5 mr-2 opacity-50" />
          <span class="text-xs">Filter periode: {{ periods.find(p => p.value === period)?.label }}</span>
        </div>
      </div>
    </template>
  </Card>
</template>
