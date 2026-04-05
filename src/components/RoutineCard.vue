<template>
  <div class="card" @click="$emit('select', routine.id)">
    <div class="card-header">
      <h2>{{ routine.name }}</h2>
      <button
        class="btn-danger"
        aria-label="Eliminar rutina"
        @click.stop="$emit('delete', routine.id)"
      >
        &#10005;
      </button>
    </div>
    <p class="text-sm text-muted">
      {{ routine.days.length }} {{ routine.days.length === 1 ? 'dia' : 'dias' }}
      &middot;
      {{ totalExercises }} {{ totalExercises === 1 ? 'ejercicio' : 'ejercicios' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Routine } from '@/types'

const props = defineProps<{
  routine: Routine
}>()

defineEmits<{
  delete: [routineId: string]
  select: [routineId: string]
}>()

const totalExercises = computed(() =>
  props.routine.days.reduce((sum, day) => sum + day.exercises.length, 0),
)
</script>

<style scoped>
.card {
  cursor: pointer;
  transition: background-color 0.15s;
}

.card:hover {
  background: var(--color-surface-hover);
}

h2 {
  font-size: 1rem;
  font-weight: 600;
}
</style>
