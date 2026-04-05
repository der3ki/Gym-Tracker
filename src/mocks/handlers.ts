import { http, HttpResponse } from 'msw'
import type { Routine } from '@/types'
import type { WorkoutLog } from '@/types'

const routines: Routine[] = []
const workoutLogs: WorkoutLog[] = []

export const handlers = [
  http.get('/api/routines', () => {
    return HttpResponse.json(routines)
  }),

  http.post('/api/routines', async ({ request }) => {
    const body = (await request.json()) as Routine
    routines.push(body)
    return HttpResponse.json(body, { status: 201 })
  }),

  http.delete('/api/routines/:id', ({ params }) => {
    const index = routines.findIndex((r) => r.id === params.id)
    if (index >= 0) routines.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/workout-logs', () => {
    return HttpResponse.json(workoutLogs)
  }),

  http.post('/api/workout-logs', async ({ request }) => {
    const body = (await request.json()) as WorkoutLog
    workoutLogs.push(body)
    return HttpResponse.json(body, { status: 201 })
  }),
]
