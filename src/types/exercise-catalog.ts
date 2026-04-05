export type MuscleCategory =
  | 'pecho'
  | 'espalda'
  | 'hombros'
  | 'biceps'
  | 'triceps'
  | 'antebrazo'
  | 'core'
  | 'gluteos'
  | 'cuadriceps'
  | 'isquiotibiales'
  | 'pantorrillas'

export const MUSCLE_CATEGORY_LABELS: Record<MuscleCategory, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombros: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebrazo: 'Antebrazo',
  core: 'Core',
  gluteos: 'Glúteos',
  cuadriceps: 'Cuádriceps',
  isquiotibiales: 'Isquiotibiales',
  pantorrillas: 'Pantorrillas',
}

export const EXERCISE_CATALOG: Record<MuscleCategory, string[]> = {
  pecho: [
    'Press banca',
    'Press inclinado',
    'Press declinado',
    'Press con mancuernas',
    'Aperturas',
    'Cruce de poleas',
    'Fondos',
  ],
  espalda: [
    'Dominadas',
    'Jalón al pecho',
    'Remo con barra',
    'Remo con mancuerna',
    'Remo en máquina',
    'Peso muerto',
  ],
  hombros: [
    'Press militar',
    'Press con mancuernas',
    'Elevaciones laterales',
    'Elevaciones frontales',
    'Pájaros',
    'Press Arnold',
  ],
  biceps: [
    'Curl con barra',
    'Curl con mancuernas',
    'Curl martillo',
    'Curl predicador',
    'Curl en polea',
  ],
  triceps: [
    'Press cerrado',
    'Extensión en polea',
    'Extensión por encima de la cabeza',
    'Rompecráneos',
    'Fondos',
  ],
  antebrazo: [
    'Curl de muñeca',
    'Curl inverso',
    'Farmer walk',
    'Wrist roller',
  ],
  core: [
    'Crunch',
    'Elevación de piernas',
    'Plancha',
    'Ab wheel',
    'Russian twist',
  ],
  gluteos: [
    'Hip thrust',
    'Puente de glúteo',
    'Patada de glúteo',
    'Step up',
    'Sentadilla búlgara',
  ],
  cuadriceps: [
    'Sentadilla',
    'Prensa',
    'Zancadas',
    'Hack squat',
    'Extensión de cuádriceps',
  ],
  isquiotibiales: [
    'Peso muerto rumano',
    'Curl femoral',
    'Good morning',
    'Nordic curl',
  ],
  pantorrillas: [
    'Elevación de talones de pie',
    'Elevación de talones sentado',
    'Elevación en prensa',
  ],
}
