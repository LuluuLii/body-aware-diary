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
  // TODO: Apple Health 卡路里导入 — 目前为手动填写字段
  // 待后续在 profile 页面添加"健康平台连接"功能后自动同步
  calories: number | null
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
  // 延迟酸痛记录时间（可能是运动后 1-3 天添加的）
  soreness_recorded_at: string | null
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
  calories?: number
  overall_feeling?: number
  tags?: string[]
}

export interface CreateAnnotationInput {
  body_part: BodyPart
  sensation: SensationType
  intensity: number
  note?: string
  side?: 'front' | 'back' | 'both'
  soreness_recorded_at?: string
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
