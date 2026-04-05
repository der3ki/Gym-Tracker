import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { isAuthenticated } from '@/services/auth'
import { getStorageMode, hasChosenMode } from '@/services/storage-provider'

const routes: RouteRecordRaw[] = [
  {
    path: '/auth',
    name: 'auth',
    component: () => import('@/views/AuthView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    name: 'routines',
    component: () => import('@/views/RoutineListView.vue'),
  },
  {
    path: '/routine/:id',
    name: 'routine-editor',
    component: () => import('@/views/RoutineEditorView.vue'),
    props: true,
  },
  {
    path: '/routine/:routineId/weeks',
    name: 'week-list',
    component: () => import('@/views/WeekListView.vue'),
    props: true,
  },
  {
    path: '/routine/:routineId/week/:weekId',
    name: 'week-detail',
    component: () => import('@/views/WeekDetailView.vue'),
    props: true,
  },
  {
    path: '/routine/:routineId/week/:weekId/day/:dayId',
    name: 'workout-session',
    component: () => import('@/views/WorkoutSessionView.vue'),
    props: true,
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  // Public routes don't need auth
  if (to.meta.public) return true

  // First visit: user hasn't chosen mode yet → go to auth
  if (!hasChosenMode()) {
    return { name: 'auth' }
  }

  // In API mode, require authentication
  if (getStorageMode() === 'api' && !isAuthenticated()) {
    return { name: 'auth' }
  }

  return true
})
