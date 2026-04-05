<template>
  <div>
    <header class="page-header">
      <button class="btn-ghost" @click="router.push({ name: 'week-list', params: { routineId } })">
        &#8592; Semanas
      </button>
      <h1>Semana {{ week?.weekNumber }}</h1>
      <span
        v-if="week"
        :class="['badge', week.status === 'completed' ? 'badge-completed' : 'badge-active']"
      >
        {{ week.status === 'completed' ? 'Completada' : 'En curso' }}
      </span>
    </header>

    <div v-if="!week || !routine" class="page-content empty-state">
      <p>Semana no encontrada.</p>
    </div>

    <div v-else class="page-content">
      <div v-for="dayPlan in week.days" :key="dayPlan.dayId" class="card">
        <div class="card-header">
          <h2>{{ getDayName(dayPlan.dayId) }}</h2>
          <span :class="['badge', (week.status === 'completed' || dayPlan.status === 'completed') ? 'badge-completed' : 'badge-pending']">
            {{ (week.status === 'completed' || dayPlan.status === 'completed') ? 'Hecho' : 'Pendiente' }}
          </span>
        </div>

        <div v-if="isDayTrainable(dayPlan)" class="day-targets">
          <div v-for="target in dayPlan.exerciseTargets" :key="target.exerciseId" class="target-item">
            <div class="target-header">
              <span class="exercise-name">{{ getExerciseName(dayPlan.dayId, target.exerciseId) }}</span>
              <span v-if="target.targetWeight > 0" class="target-values">
                {{ target.targetWeight }}kg x {{ target.targetReps }}
              </span>
            </div>
            <p class="text-sm text-muted">{{ target.recommendation }}</p>
          </div>
          <button
            class="btn-primary btn-block mt-sm"
            @click="goToWorkout(dayPlan.dayId)"
          >
            Entrenar este dia
          </button>
        </div>

        <div v-else class="day-results">
          <div v-for="completed in dayPlan.completedExercises" :key="completed.exerciseId" class="result-item">
            <h3>{{ getExerciseName(dayPlan.dayId, completed.exerciseId) }}</h3>
            <div class="sets-summary">
              <div v-for="(set, i) in completed.sets" :key="i" class="set-summary">
                <span class="text-muted">S{{ i + 1 }}:</span>
                {{ set.weight }}kg x {{ set.reps }}
                <span v-if="set.rir !== null" class="text-muted">(RIR {{ set.rir }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        v-if="week.status === 'in_progress' && allDaysCompleted"
        class="btn-primary btn-block mt-md"
        @click="handleCompleteWeek"
      >
        Completar semana y generar la siguiente
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoutine } from '@/composables/useRoutine'
import { useTrainingWeek } from '@/composables/useTrainingWeek'
import type { WeekDayPlan } from '@/types'

const props = defineProps<{
  routineId: string
  weekId: string
}>()

const router = useRouter()
const { getRoutineById, init: initRoutines } = useRoutine()
const { getWeekById, syncWeekWithRoutine, completeWeekAndGenerateNext, init: initWeeks } = useTrainingWeek()

onMounted(async () => {
  await Promise.all([initRoutines(), initWeeks()])
  if (routine.value) {
    await syncWeekWithRoutine(props.weekId, routine.value)
  }
})

const routine = computed(() => getRoutineById(props.routineId))
const week = computed(() => getWeekById(props.weekId))

const allDaysCompleted = computed(() =>
  week.value?.days.every((d) => d.status === 'completed') ?? false,
)

function isDayTrainable(dayPlan: WeekDayPlan): boolean {
  return dayPlan.status === 'pending' && week.value?.status !== 'completed'
}

function getDayName(dayId: string): string {
  const day = routine.value?.days.find((d) => d.id === dayId)
  return day?.name ?? dayId
}

function getExerciseName(dayId: string, exerciseId: string): string {
  const day = routine.value?.days.find((d) => d.id === dayId)
  const exercise = day?.exercises.find((e) => e.id === exerciseId)
  return exercise?.name ?? exerciseId
}

function goToWorkout(dayId: string) {
  router.push({
    name: 'workout-session',
    params: { routineId: props.routineId, weekId: props.weekId, dayId },
  })
}

async function handleCompleteWeek() {
  if (!routine.value) return
  const nextWeek = await completeWeekAndGenerateNext(props.weekId, routine.value)
  if (nextWeek) {
    router.push({
      name: 'week-detail',
      params: { routineId: props.routineId, weekId: nextWeek.id },
    })
  }
}
</script>

<style scoped>
h2 {
  font-size: 1rem;
  font-weight: 600;
}

h3 {
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
}

.badge-completed {
  background: var(--color-success);
  color: #0f0f0f;
}

.badge-active {
  background: var(--color-primary);
  color: white;
}

.badge-pending {
  background: var(--color-border);
  color: var(--color-text-muted);
}

.day-targets,
.day-results {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.target-item,
.result-item {
  padding: var(--spacing-sm);
  background: var(--color-bg);
  border-radius: var(--radius);
}

.target-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.exercise-name {
  font-weight: 500;
}

.target-values {
  font-weight: 600;
  color: var(--color-primary);
}

.sets-summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  font-size: 0.85rem;
}

.set-summary {
  background: var(--color-surface);
  padding: 2px var(--spacing-sm);
  border-radius: var(--radius);
}
</style>
