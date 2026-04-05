<template>
  <div class="auth-container">
    <div class="card auth-card">
      <h1>GymTracker</h1>

      <!-- Google Sign-In -->
      <div id="google-signin-btn" class="google-btn-wrapper"></div>

      <div class="divider">
        <span>o</span>
      </div>

      <div class="auth-tabs">
        <button
          :class="['tab', { active: mode === 'login' }]"
          @click="mode = 'login'"
        >
          Iniciar sesion
        </button>
        <button
          :class="['tab', { active: mode === 'register' }]"
          @click="mode = 'register'"
        >
          Registrarse
        </button>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="auth-email">Email</label>
          <input
            id="auth-email"
            v-model="email"
            type="email"
            placeholder="tu@email.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="auth-password">Contraseña</label>
          <input
            id="auth-password"
            v-model="password"
            type="password"
            placeholder="Minimo 6 caracteres"
            required
            minlength="6"
            autocomplete="current-password"
          />
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button
          type="submit"
          class="btn-primary btn-block"
          :disabled="loading"
        >
          {{ loading ? 'Cargando...' : (mode === 'login' ? 'Entrar' : 'Crear cuenta') }}
        </button>
      </form>

      <div class="divider">
        <span>o</span>
      </div>

      <button class="btn-ghost btn-block" @click="useLocal">
        Usar sin cuenta (solo local)
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { login, register, loginWithGoogle } from '@/services/auth'
import { setStorageMode } from '@/services/storage-provider'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '888434800135-mkvjmr064n8dsr561nocpp4bpa4tar2u.apps.googleusercontent.com'

const router = useRouter()

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

onMounted(() => {
  loadGoogleScript()
})

function loadGoogleScript() {
  if (document.getElementById('google-gsi-script')) {
    initGoogle()
    return
  }
  const script = document.createElement('script')
  script.id = 'google-gsi-script'
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.defer = true
  script.onload = () => initGoogle()
  document.head.appendChild(script)
}

function initGoogle() {
  const google = (window as any).google
  if (!google) return

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleResponse,
  })

  google.accounts.id.renderButton(
    document.getElementById('google-signin-btn'),
    {
      theme: 'outline',
      size: 'large',
      width: '100%',
      text: 'signin_with',
      locale: 'es',
    },
  )
}

async function handleGoogleResponse(response: { credential: string }) {
  error.value = ''
  loading.value = true

  try {
    await loginWithGoogle(response.credential)
    setStorageMode('api')
    router.push({ name: 'routines' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al iniciar con Google'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    if (mode.value === 'register') {
      await register(email.value, password.value)
    } else {
      await login(email.value, password.value)
    }
    setStorageMode('api')
    router.push({ name: 'routines' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error desconocido'
  } finally {
    loading.value = false
  }
}

function useLocal() {
  setStorageMode('local')
  router.push({ name: 'routines' })
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: var(--spacing-md);
}

.auth-card {
  width: 100%;
  max-width: 400px;
}

.auth-card h1 {
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: var(--spacing-lg);
}

.google-btn-wrapper {
  display: flex;
  justify-content: center;
}

.auth-tabs {
  display: flex;
  gap: 0;
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
}

.tab {
  flex: 1;
  padding: var(--spacing-sm);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  transition: all 0.15s;
}

.tab.active {
  background: var(--color-primary);
  color: white;
  font-weight: 600;
}

.auth-form {
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

.error-msg {
  color: var(--color-danger, #e74c3c);
  font-size: 0.85rem;
  text-align: center;
  margin: 0;
}

.divider {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: var(--spacing-lg) 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}
</style>
