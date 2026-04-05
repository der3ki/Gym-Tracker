<template>
  <div>
    <header class="page-header">
      <button class="btn-ghost" @click="router.push({ name: 'routines' })">&#8592; Volver</button>
      <h1>{{ routine?.name ?? 'Rutina' }}</h1>
      <div></div>
    </header>

    <div v-if="!routine" class="page-content empty-state">
      <p>Rutina no encontrada.</p>
    </div>

    <div v-else class="page-content">
      <button
        v-if="routine.days.length > 0 && hasExercises"
        class="btn-primary btn-block mb-md"
        @click="goToWeeks"
      >
        Entrenar / Ver semanas
      </button>

      <section class="mb-md">
        <form class="create-form" @submit.prevent="runAddDay">
          <input
            v-model="newDayName"
            type="text"
            placeholder="Nombre del dia (ej: Dia 1 - Upper)"
            aria-label="Nombre del nuevo dia"
          />
          <button type="submit" class="btn-primary" :disabled="!newDayName.trim() || addingDay">
            {{ addingDay ? 'Agregando...' : '+ Dia' }}
          </button>
        </form>
      </section>

      <div v-if="routine.days.length === 0" class="empty-state">
        <p>Agrega dias a tu rutina.</p>
      </div>

      <DayCard
        v-for="day in routine.days"
        :key="day.id"
        :day="day"
        :routine-id="routine.id"
        @remove-day="runRemoveDay"
        @add-exercise="runAddExercise"
        @remove-exercise="runRemoveExercise"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoutineStore } from '@/stores/routine'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { createExerciseFactory } from '@/composables/useExerciseFactory'
import type { ExerciseType, RepRange } from '@/types'
import DayCard from '@/components/DayCard.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()
const routineStore = useRoutineStore()
const exerciseFactory = createExerciseFactory()

onMounted(() => routineStore.ensureLoaded())

const newDayName = ref('')

const routine = computed(() => routineStore.getRoutineById(props.id))

const hasExercises = computed(() =>
  routine.value?.days.some((d) => d.exercises.length > 0) ?? false,
)

const { loading: addingDay, run: runAddDay } = useAsyncAction(async () => {
  const name = newDayName.value.trim()
  if (!name) return
  await routineStore.addDay(props.id, name)
  newDayName.value = ''
})

const { run: runRemoveDay } = useAsyncAction(async (dayId: string) => {
  await routineStore.removeDay(props.id, dayId)
})

const { run: runAddExercise } = useAsyncAction(async (dayId: string, name: string, type: ExerciseType, repRange: RepRange, sets: number, category: string) => {
  const exercise = exerciseFactory.create(name, type, repRange, sets, category)
  await routineStore.addExerciseToDay(props.id, dayId, exercise)
})

const { run: runRemoveExercise } = useAsyncAction(async (dayId: string, exerciseId: string) => {
  await routineStore.removeExerciseFromDay(props.id, dayId, exerciseId)
})

function goToWeeks() {
  router.push({ name: 'week-list', params: { routineId: props.id } })
}
</script>

<style scoped>
.create-form {
  display: flex;
  gap: var(--spacing-sm);
}

.create-form input {
  flex: 1;
}
</style>
