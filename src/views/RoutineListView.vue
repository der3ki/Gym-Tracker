<template>
  <div>
    <header class="page-header">
      <h1>Mis Rutinas</h1>
    </header>

    <div class="page-content">
      <form class="create-form" @submit.prevent="handleCreate">
        <input
          v-model="newRoutineName"
          type="text"
          placeholder="Nombre de la rutina..."
          aria-label="Nombre de la nueva rutina"
        />
        <button type="submit" class="btn-primary" :disabled="!newRoutineName.trim()">
          Crear
        </button>
      </form>

      <div v-if="routines.length === 0" class="empty-state">
        <p>No tienes rutinas todavia.</p>
        <p class="text-sm text-muted mt-sm">Crea tu primera rutina para empezar.</p>
      </div>

      <RoutineCard
        v-for="routine in routines"
        :key="routine.id"
        :routine="routine"
        @delete="handleDelete"
        @select="handleSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoutineStore } from '@/stores/routine'
import RoutineCard from '@/components/RoutineCard.vue'

const router = useRouter()
const routineStore = useRoutineStore()
const routines = routineStore.routines

onMounted(() => routineStore.ensureLoaded())

const newRoutineName = ref('')

async function handleCreate() {
  const name = newRoutineName.value.trim()
  if (!name) return
  await routineStore.createRoutine(name)
  newRoutineName.value = ''
}

async function handleDelete(routineId: string) {
  await routineStore.deleteRoutine(routineId)
}

function handleSelect(routineId: string) {
  router.push({ name: 'routine-editor', params: { id: routineId } })
}
</script>

<style scoped>
.create-form {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.create-form input {
  flex: 1;
}
</style>
