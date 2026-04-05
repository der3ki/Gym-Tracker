import express from 'express'
import cors from 'cors'
import { authMiddleware } from './middleware/auth.js'
import { authRouter } from './routes/auth.js'
import { routinesRouter } from './routes/routines.js'
import { trainingWeeksRouter } from './routes/training-weeks.js'
import { workoutLogsRouter } from './routes/workout-logs.js'
import { userProfileRouter } from './routes/user-profile.js'

export const app = express()

app.use(cors())
app.use(express.json())

// Health check (public)
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// Public routes (no auth required)
app.use('/api/auth', authRouter)

// Protected routes
app.use('/api', authMiddleware)

app.use('/api/routines', routinesRouter)
app.use('/api/training-weeks', trainingWeeksRouter)
app.use('/api/workout-logs', workoutLogsRouter)
app.use('/api/user-profile', userProfileRouter)
