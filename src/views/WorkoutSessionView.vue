<template>
  <div>
    <header class="page-header">
      <button class="btn-ghost" @click="goBack">&#8592; Volver</button>
      <h1>{{ dayData?.name ?? 'Entrenamiento' }}</h1>
      <div></div>
    </header>

    <div v-if="!routine || !dayData || !week" class="page-content empty-state">
      <p>Entrenamiento no encontrado.</p>
    </div>

    <div v-else class="page-content">
      <ExerciseSession
        v-for="exercise in dayData.exercises"
        :key="exercise.id"
        :exercise="exercise"
        :target="getTarget(exercise.id)"
        :session-data="sessionData[exercise.id]"
        @update-sets="(sets) => updateSets(exercise.id, sets)"
      />

      <button
        class="btn-primary btn-block mt-md"
        :disabled="!hasData"
        @click="handleSave"
      >
        Guardar entrenamiento
      </button>

      <p v-if="saved" class="text-sm mt-sm" style="text-align: center; color: var(--color-success)">
        Entrenamiento guardado. Volviendo a la semana...
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRoutineStore } from '@/stores/routine'
import { useTrainingWeekStore } from '@/stores/trainingWeek'
import type { SetLog, ExerciseTarget } from '@/types'
import ExerciseSession from '@/components/ExerciseSession.vue'

const props = defineProps<{
  routineId: string
  weekId: string
  dayId: string
}>()

const router = useRouter()
const routineStore = useRoutineStore()
const weekStore = useTrainingWeekStore()

const routine = computed(() => routineStore.getRoutineById(props.routineId))
const week = computed(() => weekStore.getWeekById(props.weekId))
const dayData = computed(() => routine.value?.days.find((d) => d.id === props.dayId))
const dayPlan = computed(() => week.value?.days.find((d) => d.dayId === props.dayId))

const sessionData = reactive<Record<string, SetLog[]>>({})
const saved = ref(false)

function initSessionData() {
  if (!dayData.value) return
  dayData.value.exercises.forEach((exercise) => {
    if (sessionData[exercise.id]) return
    const target = getTarget(exercise.id)
    sessionData[exercise.id] = Array.from({ length: exercise.defaultSets }, () => ({
      reps: target?.targetReps ?? 0,
      weight: target?.targetWeight ?? 0,
      rir: null,
    }))
  })
}

onMounted(async () => {
  await Promise.all([routineStore.ensureLoaded(), weekStore.ensureLoaded()])
  initSessionData()
})

watch(dayData, () => initSessionData())

function getTarget(exerciseId: string): ExerciseTarget | undefined {
  return dayPlan.value?.exerciseTargets.find((t) => t.exerciseId === exerciseId)
}

function updateSets(exerciseId: string, sets: SetLog[]) {
  sessionData[exerciseId] = sets
}

const hasData = computed(() =>
  Object.values(sessionData).some((sets) =>
    sets.some((s) => s.weight > 0 && s.reps > 0),
  ),
)

async function handleSave() {
  const exercises = Object.entries(sessionData)
    .filter(([, sets]) => sets.some((s) => s.weight > 0 && s.reps > 0))
    .map(([exerciseId, sets]) => ({
      exerciseId,
      sets: sets.filter((s) => s.weight > 0 && s.reps > 0),
    }))

  if (exercises.length === 0) return

  await weekStore.saveDayWorkout(props.weekId, props.dayId, exercises)
  saved.value = true

  setTimeout(() => {
    router.push({
      name: 'week-detail',
      params: { routineId: props.routineId, weekId: props.weekId },
    })
  }, 1000)
}

function goBack() {
  router.push({
    name: 'week-detail',
    params: { routineId: props.routineId, weekId: props.weekId },
  })
}
</script>
