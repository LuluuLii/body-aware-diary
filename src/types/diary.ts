import type { BodyPart, SensationType } from './body'

export type ActivityType =
  | 'strength' | 'cardio' | 'flexibility' | 'yoga' | 'pilates' | 'dance'
  | 'martial_arts' | 'swimming' | 'running' | 'cycling' | 'hiking'
  | 'rehabilitation' | 'meditation' | 'other'

export interface DiaryEntry {
  id: string
  user_id: string
  title: string
  content: string | null
  activity_type: ActivityType
  activity_name: string | null
  duration_minutes: number | null
  intensity: number | null
  overall_feeling: number | null
  tags: string[]
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface BodyAnnotation {
  id: string
  entry_id: string
  user_id: string
  body_part: BodyPart
  sensation: SensationType
  intensity: number
  note: string | null
  side: 'front' | 'back' | 'both'
  created_at: string
}

export interface DiaryEntryWithAnnotations extends DiaryEntry {
  annotations: BodyAnnotation[]
}

export interface CreateEntryInput {
  user_id: string
  title: string
  content?: string
  activity_type: ActivityType
  activity_name?: string
  duration_minutes?: number
  intensity?: number
  overall_feeling?: number
  tags?: string[]
}

export interface CreateAnnotationInput {
  body_part: BodyPart
  sensation: SensationType
  intensity: number
  note?: string
  side?: 'front' | 'back' | 'both'
}

export interface SearchFilters {
  query?: string
  activity_type?: ActivityType
  body_part?: BodyPart
  sensation?: SensationType
  date_from?: string
  date_to?: string
  favorites_only?: boolean
}
