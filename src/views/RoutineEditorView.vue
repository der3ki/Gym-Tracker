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
        <form class="create-form" @submit.prevent="handleAddDay">
          <input
            v-model="newDayName"
            type="text"
            placeholder="Nombre del dia (ej: Dia 1 - Upper)"
            aria-label="Nombre del nuevo dia"
          />
          <button type="submit" class="btn-primary" :disabled="!newDayName.trim()">
            + Dia
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
        @remove-day="handleRemoveDay"
        @add-exercise="handleAddExercise"
        @remove-exercise="handleRemoveExercise"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoutine } from '@/composables/useRoutine'
import { createExerciseFactory } from '@/composables/useExerciseFactory'
import type { ExerciseType, RepRange } from '@/types'
import DayCard from '@/components/DayCard.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()
const { getRoutineById, init, addDay, removeDay, addExerciseToDay, removeExerciseFromDay } =
  useRoutine()
const exerciseFactory = createExerciseFactory()

onMounted(() => init())

const newDayName = ref('')

const routine = computed(() => getRoutineById(props.id))

const hasExercises = computed(() =>
  routine.value?.days.some((d) => d.exercises.length > 0) ?? false,
)

async function handleAddDay() {
  const name = newDayName.value.trim()
  if (!name) return
  await addDay(props.id, name)
  newDayName.value = ''
}

async function handleRemoveDay(dayId: string) {
  await removeDay(props.id, dayId)
}

async function handleAddExercise(dayId: string, name: string, type: ExerciseType, repRange: RepRange, sets: number, category: string) {
  const exercise = exerciseFactory.create(name, type, repRange, sets, category)
  await addExerciseToDay(props.id, dayId, exercise)
}

async function handleRemoveExercise(dayId: string, exerciseId: string) {
  await removeExerciseFromDay(props.id, dayId, exerciseId)
}

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
