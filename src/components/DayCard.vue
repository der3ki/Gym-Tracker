<template>
  <div class="card">
    <div class="card-header">
      <h2>{{ day.name }}</h2>
      <button class="btn-danger" aria-label="Eliminar dia" @click="$emit('removeDay', day.id)">
        &#10005;
      </button>
    </div>

    <div class="exercise-list">
      <div v-for="exercise in day.exercises" :key="exercise.id" class="exercise-item">
        <div class="exercise-info">
          <span class="exercise-name">{{ exercise.name }}</span>
          <span v-if="exercise.category" class="badge badge-category">
            {{ MUSCLE_CATEGORY_LABELS[exercise.category as MuscleCategory] ?? exercise.category }}
          </span>
          <span :class="['badge', `badge-${exercise.type}`]">
            {{ TYPE_LABELS[exercise.type] }}
          </span>
          <span class="text-sm text-muted">
            {{ exercise.defaultSets }}x{{ exercise.repRange.min }}-{{ exercise.repRange.max }}
          </span>
        </div>
        <button
          class="btn-danger"
          aria-label="Eliminar ejercicio"
          @click="$emit('removeExercise', day.id, exercise.id)"
        >
          &#10005;
        </button>
      </div>
    </div>

    <form v-if="showAddForm" class="add-exercise-form mt-sm" @submit.prevent="handleSubmit">
      <select v-model="selectedCategory" aria-label="Categoria muscular">
        <option value="" disabled>Categoria...</option>
        <option v-for="(label, key) in MUSCLE_CATEGORY_LABELS" :key="key" :value="key">
          {{ label }}
        </option>
      </select>
      <select
        v-model="exerciseName"
        aria-label="Ejercicio"
        :disabled="!selectedCategory"
      >
        <option value="" disabled>Ejercicio...</option>
        <option v-for="name in availableExercises" :key="name" :value="name">
          {{ name }}
        </option>
      </select>
      <select v-model="exerciseType" aria-label="Tipo de ejercicio" @change="onTypeChange">
        <option value="strength">Fuerza</option>
        <option value="hypertrophy">Hipertrofia</option>
        <option value="endurance">Resistencia</option>
      </select>
      <div class="rep-range-row">
        <label class="text-sm text-muted">Rango de reps:</label>
        <input
          v-model.number="repMin"
          type="number"
          :min="currentBounds.floor"
          :max="repMax"
          aria-label="Reps minimas"
        />
        <span class="text-muted">-</span>
        <input
          v-model.number="repMax"
          type="number"
          :min="repMin"
          :max="currentBounds.ceiling"
          aria-label="Reps maximas"
        />
      </div>
      <div class="sets-row">
        <label class="text-sm text-muted">Series:</label>
        <input
          v-model.number="sets"
          type="number"
          min="1"
          max="10"
          aria-label="Numero de series"
        />
      </div>
      <p class="text-sm text-muted">
        Permitido: {{ currentBounds.floor }}-{{ currentBounds.ceiling }} reps
      </p>
      <div class="form-actions">
        <button type="submit" class="btn-primary" :disabled="!isFormValid">
          Agregar
        </button>
        <button type="button" class="btn-ghost" @click="resetForm">
          Cancelar
        </button>
      </div>
    </form>

    <button v-else class="btn-ghost mt-sm" @click="showAddForm = true">
      + Ejercicio
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { WorkoutDay, ExerciseType, RepRange, MuscleCategory } from '@/types'
import { REP_RANGE_BOUNDS, MUSCLE_CATEGORY_LABELS, EXERCISE_CATALOG } from '@/types'

const TYPE_LABELS: Record<ExerciseType, string> = {
  strength: 'Fuerza',
  hypertrophy: 'Hipertrofia',
  endurance: 'Resistencia',
}

const props = defineProps<{
  day: WorkoutDay
  routineId: string
}>()

const emit = defineEmits<{
  removeDay: [dayId: string]
  addExercise: [dayId: string, name: string, type: ExerciseType, repRange: RepRange, sets: number, category: string]
  removeExercise: [dayId: string, exerciseId: string]
}>()

const showAddForm = ref(false)
const selectedCategory = ref<MuscleCategory | ''>('')
const exerciseName = ref('')
const exerciseType = ref<ExerciseType>('strength')
const repMin = ref(REP_RANGE_BOUNDS.strength.floor)
const repMax = ref(REP_RANGE_BOUNDS.strength.ceiling)
const sets = ref(4)

const availableExercises = computed(() =>
  selectedCategory.value ? EXERCISE_CATALOG[selectedCategory.value] : [],
)

watch(selectedCategory, () => {
  exerciseName.value = ''
})

const currentBounds = computed(() => REP_RANGE_BOUNDS[exerciseType.value])

const isFormValid = computed(() => {
  const bounds = currentBounds.value
  return (
    selectedCategory.value !== '' &&
    exerciseName.value !== '' &&
    repMin.value >= bounds.floor &&
    repMax.value <= bounds.ceiling &&
    repMax.value >= repMin.value &&
    sets.value >= 1
  )
})

function onTypeChange() {
  const bounds = currentBounds.value
  repMin.value = bounds.floor
  repMax.value = bounds.ceiling
}

function resetForm() {
  selectedCategory.value = ''
  exerciseName.value = ''
  exerciseType.value = 'strength'
  repMin.value = REP_RANGE_BOUNDS.strength.floor
  repMax.value = REP_RANGE_BOUNDS.strength.ceiling
  sets.value = 4
  showAddForm.value = false
}

function handleSubmit() {
  if (!isFormValid.value) return
  emit('addExercise', props.day.id, exerciseName.value, exerciseType.value, { min: repMin.value, max: repMax.value }, sets.value, selectedCategory.value as string)
  resetForm()
}
</script>

<style scoped>
h2 {
  font-size: 1rem;
  font-weight: 600;
}

.exercise-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.exercise-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background: var(--color-bg);
  border-radius: var(--radius);
}

.exercise-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.exercise-name {
  font-weight: 500;
}

.add-exercise-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.rep-range-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.rep-range-row label,
.sets-row label {
  white-space: nowrap;
}

.rep-range-row input {
  width: 60px;
}

.sets-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.sets-row input {
  width: 60px;
}

.form-actions {
  display: flex;
  gap: var(--spacing-sm);
}
</style>
