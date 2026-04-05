<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>{{ exerciseName }}</h3>
      <div class="chart-toggle">
        <button
          :class="['toggle-btn', mode === 'weight' ? 'active' : '']"
          @click="mode = 'weight'"
        >
          Peso
        </button>
        <button
          :class="['toggle-btn', mode === 'volume' ? 'active' : '']"
          @click="mode = 'volume'"
        >
          Volumen
        </button>
      </div>
    </div>
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'
import type { WeekDataPoint } from '@/stores/stats'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const props = defineProps<{
  exerciseName: string
  dataPoints: WeekDataPoint[]
}>()

const mode = ref<'weight' | 'volume'>('weight')

const chartData = computed(() => ({
  labels: props.dataPoints.map((d) => `S${d.weekNumber}`),
  datasets: [
    {
      data: props.dataPoints.map((d) => mode.value === 'weight' ? d.maxWeight : d.volume),
      borderColor: '#4f8cff',
      backgroundColor: 'rgba(79, 140, 255, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: '#4f8cff',
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { parsed: { y: number | null } }) => {
          const val = ctx.parsed.y ?? 0
          return mode.value === 'weight' ? `${val} kg` : `${val} kg·reps`
        },
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#888' },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
    y: {
      ticks: { color: '#888' },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
  },
}))
</script>

<style scoped>
.chart-container {
  padding: var(--spacing-sm);
  background: var(--color-bg);
  border-radius: var(--radius);
  height: 220px;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.chart-header h3 {
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
}

.chart-toggle {
  display: flex;
  gap: 2px;
  background: var(--color-surface);
  border-radius: var(--radius);
  padding: 2px;
}

.toggle-btn {
  padding: 2px var(--spacing-sm);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  border-radius: var(--radius);
  cursor: pointer;
}

.toggle-btn.active {
  background: var(--color-primary);
  color: white;
}
</style>
