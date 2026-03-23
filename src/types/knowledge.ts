import type { BodyPart } from './body'

export type KnowledgeCategory =
  | 'body_awareness' | 'meditation' | 'muscle_anatomy' | 'movement_pattern'
  | 'recovery' | 'breathing' | 'mindfulness'

export type ContentType = 'text_card' | 'video' | 'infographic' | 'guided_practice'

export type MaterialSource = 'text_input' | 'url_import' | 'file_upload' | 'clipboard'

export interface KnowledgeCard {
  id: string
  title: string
  summary: string | null
  content: string
  category: KnowledgeCategory
  content_type: ContentType
  media_url: string | null
  body_parts: BodyPart[]
  tags: string[]
  difficulty: number | null
  is_builtin: boolean
  created_at: string
}

export interface UserMaterial {
  id: string
  user_id: string
  title: string
  content: string
  source: MaterialSource
  source_url: string | null
  tags: string[]
  body_parts: BodyPart[]
  is_embedded: boolean
  created_at: string
  updated_at: string
}

export interface CreateMaterialInput {
  title: string
  content: string
  source: MaterialSource
  source_url?: string
  tags?: string[]
  body_parts?: BodyPart[]
}

export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  body_awareness: '身体觉知',
  meditation: '冥想引导',
  muscle_anatomy: '肌肉解剖',
  movement_pattern: '运动模式',
  recovery: '恢复拉伸',
  breathing: '呼吸法',
  mindfulness: '正念感知',
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  text_card: '文字卡片',
  video: '短视频',
  infographic: '科普图文',
  guided_practice: '引导练习',
}
