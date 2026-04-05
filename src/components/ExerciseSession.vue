<template>
  <div class="card">
    <div class="card-header">
      <div class="exercise-title">
        <h2>{{ exercise.name }}</h2>
        <span :class="['badge', `badge-${exercise.type}`]">
          {{ TYPE_LABELS[exercise.type] }}
        </span>
      </div>
    </div>

    <div v-if="target" class="recommendation mb-md">
      <div v-if="target.targetWeight > 0" class="target-display">
        <span class="target-value">{{ target.targetWeight }}kg x {{ target.targetReps }} reps</span>
      </div>
      <p class="text-sm text-muted mt-sm">{{ target.recommendation }}</p>
    </div>

    <p class="text-sm text-muted mb-md">
      Rango: {{ exercise.repRange.min }}-{{ exercise.repRange.max }} reps
    </p>

    <div class="sets-header">
      <span class="set-label">Serie</span>
      <span class="set-label">Peso (kg)</span>
      <span class="set-label">Reps</span>
      <span class="set-label">RIR</span>
    </div>

    <div v-for="(set, index) in localSets" :key="index" class="set-row">
      <span class="set-number">{{ index + 1 }}</span>
      <input
        v-model.number="set.weight"
        type="number"
        min="0"
        step="0.5"
        :aria-label="`Peso serie ${index + 1}`"
        @input="emitUpdate"
      />
      <input
        v-model.number="set.reps"
        type="number"
        min="0"
        :aria-label="`Reps serie ${index + 1}`"
        @input="emitUpdate"
      />
      <input
        v-model.number="set.rir"
        type="number"
        min="0"
        max="10"
        placeholder="-"
        :aria-label="`RIR serie ${index + 1}`"
        @input="emitUpdate"
      />
    </div>

    <div class="set-actions mt-sm">
      <button class="btn-ghost" @click="addSet">+ Serie</button>
      <button v-if="localSets.length > 1" class="btn-ghost" @click="removeLastSet">- Serie</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { Exercise, SetLog, ExerciseTarget, ExerciseType } from '@/types'

const TYPE_LABELS: Record<ExerciseType, string> = {
  strength: 'Fuerza',
  hypertrophy: 'Hipertrofia',
  endurance: 'Resistencia',
}

const props = defineProps<{
  exercise: Exercise
  target?: ExerciseTarget
  sessionData: SetLog[]
}>()

const emit = defineEmits<{
  updateSets: [sets: SetLog[]]
}>()

const localSets = reactive<SetLog[]>([...props.sessionData])

watch(
  () => props.sessionData,
  (newData) => {
    localSets.splice(0, localSets.length, ...newData)
  },
)

function emitUpdate() {
  emit('updateSets', [...localSets])
}

function addSet() {
  localSets.push({ reps: 0, weight: 0, rir: null })
  emitUpdate()
}

function removeLastSet() {
  if (localSets.length > 1) {
    localSets.pop()
    emitUpdate()
  }
}
</script>

<style scoped>
h2 {
  font-size: 1rem;
  font-weight: 600;
}

.exercise-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.recommendation {
  padding: var(--spacing-sm);
  background: var(--color-bg);
  border-radius: var(--radius);
}

.target-display {
  margin-bottom: var(--spacing-xs);
}

.target-value {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-primary);
}

.sets-header {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 1fr;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
}

.set-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: center;
}

.set-row {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 1fr;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
  align-items: center;
}

.set-number {
  text-align: center;
  font-weight: 600;
  color: var(--color-text-muted);
}

.set-actions {
  display: flex;
  gap: var(--spacing-sm);
}
</style>
