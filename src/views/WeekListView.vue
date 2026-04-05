<template>
  <div>
    <header class="page-header">
      <button class="btn-ghost" @click="router.push({ name: 'routine-editor', params: { id: routineId } })">
        &#8592; Rutina
      </button>
      <h1>{{ routine?.name ?? 'Semanas' }}</h1>
      <div></div>
    </header>

    <div class="page-content">
      <div v-if="!routine" class="empty-state">
        <p>Rutina no encontrada.</p>
      </div>

      <template v-else>
        <button
          v-if="!activeWeek"
          class="btn-primary btn-block mb-md"
          @click="handleStartFirstWeek"
        >
          Empezar Semana 1
        </button>

        <div v-if="routineWeeks.length === 0" class="empty-state">
          <p>Aun no has empezado a entrenar.</p>
          <p class="text-sm text-muted mt-sm">Pulsa el boton para comenzar tu primera semana.</p>
        </div>

        <div
          v-for="week in routineWeeksReversed"
          :key="week.id"
          class="card week-card"
          @click="goToWeek(week.id)"
        >
          <div class="card-header">
            <h2>Semana {{ week.weekNumber }}</h2>
            <span :class="['badge', week.status === 'completed' ? 'badge-completed' : 'badge-active']">
              {{ week.status === 'completed' ? 'Completada' : 'En curso' }}
            </span>
          </div>
          <div class="week-progress">
            <span class="text-sm text-muted">
              {{ completedDays(week) }}/{{ week.days.length }} dias completados
            </span>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${(completedDays(week) / week.days.length) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoutineStore } from '@/stores/routine'
import { useTrainingWeekStore } from '@/stores/trainingWeek'
import type { TrainingWeek } from '@/types'

const props = defineProps<{ routineId: string }>()
const router = useRouter()
const routineStore = useRoutineStore()
const weekStore = useTrainingWeekStore()

onMounted(async () => {
  await Promise.all([routineStore.ensureLoaded(), weekStore.ensureLoaded()])
})

const routine = computed(() => routineStore.getRoutineById(props.routineId))
const routineWeeks = computed(() => weekStore.getWeeksByRoutine(props.routineId))
const routineWeeksReversed = computed(() => [...routineWeeks.value].reverse())
const activeWeek = computed(() => weekStore.getActiveWeek(props.routineId))

function completedDays(week: TrainingWeek): number {
  return week.days.filter((d) => d.status === 'completed').length
}

async function handleStartFirstWeek() {
  if (!routine.value) return
  const week = await weekStore.startFirstWeek(routine.value)
  router.push({ name: 'week-detail', params: { routineId: props.routineId, weekId: week.id } })
}

function goToWeek(weekId: string) {
  router.push({ name: 'week-detail', params: { routineId: props.routineId, weekId } })
}
</script>

<style scoped>
h2 {
  font-size: 1rem;
  font-weight: 600;
}

.week-card {
  cursor: pointer;
  transition: background-color 0.15s;
}

.week-card:hover {
  background: var(--color-surface-hover);
}

.badge-completed {
  background: var(--color-success);
  color: #0f0f0f;
}

.badge-active {
  background: var(--color-primary);
  color: white;
}

.week-progress {
  margin-top: var(--spacing-sm);
}

.progress-bar {
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  margin-top: var(--spacing-xs);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
  transition: width 0.3s;
}
</style>
