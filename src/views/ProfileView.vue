<template>
  <div>
    <header class="page-header">
      <h1>Mi Perfil</h1>
    </header>

    <div class="page-content">
      <!-- Create profile -->
      <div v-if="!hasProfile" class="card">
        <form class="profile-form" @submit.prevent="handleCreate">
          <h2>Crear perfil</h2>
          <div class="form-group">
            <label for="profile-name">Nombre</label>
            <input
              id="profile-name"
              v-model="newName"
              type="text"
              placeholder="Tu nombre..."
              required
            />
          </div>
          <button type="submit" class="btn-primary btn-block" :disabled="!newName.trim()">
            Crear perfil
          </button>
        </form>
      </div>

      <!-- Profile view -->
      <template v-else>
        <div class="card">
          <div v-if="!editing" class="profile-info">
            <div class="profile-header">
              <h2>{{ profile!.name }}</h2>
              <button class="btn-ghost" @click="startEdit">Editar</button>
            </div>

            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Peso corporal</span>
                <span class="stat-value">{{ profile!.bodyWeight ? `${profile!.bodyWeight} kg` : '—' }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Altura</span>
                <span class="stat-value">{{ profile!.height ? `${profile!.height} cm` : '—' }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Inicio entrenamiento</span>
                <span class="stat-value">{{ profile!.trainingStartDate ?? '—' }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Dias entrenando</span>
                <span class="stat-value">{{ daysSinceStart !== null ? daysSinceStart : '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Edit form -->
          <form v-else class="profile-form" @submit.prevent="handleSave">
            <h2>Editar perfil</h2>
            <div class="form-group">
              <label for="edit-name">Nombre</label>
              <input id="edit-name" v-model="editName" type="text" required />
            </div>
            <div class="form-group">
              <label for="edit-weight">Peso corporal (kg)</label>
              <input id="edit-weight" v-model.number="editWeight" type="number" step="0.1" min="0" />
            </div>
            <div class="form-group">
              <label for="edit-height">Altura (cm)</label>
              <input id="edit-height" v-model.number="editHeight" type="number" step="1" min="0" />
            </div>
            <div class="form-group">
              <label for="edit-start-date">Fecha inicio entrenamiento</label>
              <input id="edit-start-date" v-model="editStartDate" type="date" />
            </div>
            <div class="form-actions">
              <button type="button" class="btn-ghost" @click="editing = false">Cancelar</button>
              <button type="submit" class="btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </template>

      <!-- Progression Charts -->
      <div class="card">
        <h2>Progresion</h2>
        <div v-if="routines.length === 0" class="empty-state">
          <p class="text-muted">Crea una rutina para ver tu progresion.</p>
        </div>
        <template v-else>
          <select v-model="selectedRoutineId" class="routine-select">
            <option v-for="r in routines" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
          <div v-if="progressions.length === 0" class="empty-state mt-sm">
            <p class="text-muted">Sin datos todavia. Completa entrenamientos para ver graficas.</p>
          </div>
          <div v-else class="charts-list">
            <ProgressionChart
              v-for="prog in progressions"
              :key="prog.exerciseId"
              :exercise-name="prog.exerciseName"
              :data-points="prog.dataPoints"
            />
          </div>
        </template>
      </div>

      <!-- Personal Records -->
      <div class="card">
        <h2>Records Personales</h2>
        <div v-if="personalRecords.length === 0" class="empty-state">
          <p class="text-muted">Entrena para registrar tus primeros PRs.</p>
        </div>
        <div v-else class="pr-list">
          <div v-for="pr in personalRecords" :key="pr.exerciseId" class="pr-item">
            <div class="pr-info">
              <span class="pr-name">{{ pr.exerciseName }}</span>
              <span class="text-sm text-muted">Semana {{ pr.weekNumber }}</span>
            </div>
            <div class="pr-value">
              {{ pr.weight }}kg x {{ pr.reps }}
            </div>
          </div>
        </div>
      </div>

      <!-- Session -->
      <div class="card">
        <h2>Sesion</h2>
        <p v-if="authUser" class="text-sm text-muted mb-sm">{{ authUser.email }}</p>
        <p v-else class="text-sm text-muted mb-sm">Modo local (sin cuenta)</p>
        <button class="btn-ghost btn-block" @click="handleLogout">
          {{ authUser ? 'Cerrar sesion' : 'Cambiar modo' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserProfileStore } from '@/stores/userProfile'
import { useStatsStore } from '@/stores/stats'
import { useRoutineStore } from '@/stores/routine'
import { getAuthUser, logout } from '@/services/auth'
import { setStorageMode } from '@/services/storage-provider'
import type { PersonalRecord, ExerciseProgression } from '@/stores/stats'
import ProgressionChart from '@/components/ProgressionChart.vue'

const router = useRouter()
const authUser = getAuthUser()
const profileStore = useUserProfileStore()
const statsStore = useStatsStore()
const routineStore = useRoutineStore()

const { profile, hasProfile, daysSinceStart } = storeToRefs(profileStore)
const { routines } = storeToRefs(routineStore)

const personalRecords = ref<PersonalRecord[]>([])
const progressions = ref<ExerciseProgression[]>([])
const selectedRoutineId = ref('')

async function loadStats() {
  personalRecords.value = await statsStore.getPersonalRecords()
  if (selectedRoutineId.value) {
    progressions.value = await statsStore.getExerciseProgressions(selectedRoutineId.value)
  } else {
    progressions.value = []
  }
}

onMounted(async () => {
  await Promise.all([profileStore.ensureLoaded(), routineStore.ensureLoaded()])
  if (routineStore.routines.length > 0 && !selectedRoutineId.value) {
    selectedRoutineId.value = routineStore.routines[0].id
  }
  await loadStats()
})

watch(selectedRoutineId, () => loadStats())

const newName = ref('')
const editing = ref(false)

const editName = ref('')
const editWeight = ref<number | null>(null)
const editHeight = ref<number | null>(null)
const editStartDate = ref('')

async function handleCreate() {
  const name = newName.value.trim()
  if (!name) return
  await profileStore.createProfile(name)
  newName.value = ''
}

function startEdit() {
  if (!profile.value) return
  editName.value = profile.value.name
  editWeight.value = profile.value.bodyWeight
  editHeight.value = profile.value.height
  editStartDate.value = profile.value.trainingStartDate ?? ''
  editing.value = true
}

async function handleSave() {
  await profileStore.updateProfile({
    name: editName.value.trim(),
    bodyWeight: editWeight.value || null,
    height: editHeight.value || null,
    trainingStartDate: editStartDate.value || null,
  })
  editing.value = false
}

function handleLogout() {
  logout()
  setStorageMode('local')
  routineStore.$reset()
  profileStore.$reset()
  router.push({ name: 'auth' })
}
</script>

<style scoped>
h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.profile-header h2 {
  margin-bottom: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--color-bg);
  border-radius: var(--radius);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-group label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.form-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

.pr-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.pr-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background: var(--color-bg);
  border-radius: var(--radius);
}

.pr-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pr-name {
  font-weight: 500;
}

.pr-value {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-primary);
}

.routine-select {
  width: 100%;
  margin-bottom: var(--spacing-sm);
}

.charts-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-sm);
}
</style>
