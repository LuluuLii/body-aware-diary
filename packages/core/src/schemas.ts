// @body-diary/core · Zod schemas for v2 domain objects
// These mirror the DB shape but focus on the v2 subset (some v1 columns are
// ignored / kept as passthrough for backward compat). Runtime validation is
// mostly at API boundaries — internal code trusts TypeScript types.

import { z } from 'zod'

// ─── SensationPicker coordinate (象限点位) ─────────────────────

export const SensationCoordSchema = z.object({
  x: z.number().min(-1).max(1),
  y: z.number().min(-1).max(1),
})

export type SensationCoord = z.infer<typeof SensationCoordSchema>

// ─── Muscle-level sensation tag (BodyMap 5 tag) ────────────────
// Note: DB enum `sensation_type` has more values (v1 legacy: pain/fatigue/pump...)
// v2 code only uses these 5. Others stay accepted at DB layer for old records.

export const MuscleSensationTagSchema = z.enum([
  'soreness',   // 酸
  'tightness',  // 紧
  'warmth',     // 温
  'swell',      // 涨
  'none',       // 无感
])

export type MuscleSensationTag = z.infer<typeof MuscleSensationTagSchema>

/** UI label ↔ enum key. Kept here (not in content) because it's DB-bound. */
export const SENSATION_TAG_LABELS: Record<MuscleSensationTag, string> = {
  soreness:  '酸',
  tightness: '紧',
  warmth:    '温',
  swell:     '涨',
  none:      '无感',
}

// ─── Body annotation (v2 muscle-level) ─────────────────────────

export const BodyAnnotationSchema = z.object({
  id: z.string().uuid(),
  entry_id: z.string().uuid(),
  user_id: z.string().uuid(),
  muscle_asset_id: z.string(),        // e.g. 'delt_l', 'hip_r' — @body-diary/assets id
  sensation: MuscleSensationTagSchema,
  note: z.string().nullable(),
  /** v2.7-A: 可选关联到 practice.pose_ids 里的某个 pose（"这块酸是练哪个来的"）。*/
  pose_id: z.string().nullable(),
  created_at: z.string(),
})

export type BodyAnnotation = z.infer<typeof BodyAnnotationSchema>

/** Draft: what the client sends when creating a new annotation. */
export const BodyAnnotationDraftSchema = BodyAnnotationSchema
  .pick({ muscle_asset_id: true, sensation: true })
  .extend({
    note: z.string().nullable().optional(),
    pose_id: z.string().nullable().optional(),
  })

export type BodyAnnotationDraft = z.infer<typeof BodyAnnotationDraftSchema>

// ─── Diary entry (v2 subset — ignores unused v1 columns) ───────

/**
 * Activity type — v2.6 精简版：合并瑜伽/普拉提为"垫上"，舞蹈只保留芭蕾，
 * 去掉暂时用不到的 cardio/flexibility/martial_arts/meditation。
 * 未来预留：pilates_reformer（大器械普拉提，需要器械+阻力字段）。
 */
export const ActivityTypeSchema = z.enum([
  'yoga_mat',       // 垫上（瑜伽 + 垫上普拉提合并）
  'ballet',         // 芭蕾
  'swimming',       // 游泳
  'strength',       // 力量
  'running',        // 跑步
  'cycling',        // 骑行
  'hiking',         // 徒步
  'rehabilitation', // 康复
  'other',          // 其他
])

export type ActivityType = z.infer<typeof ActivityTypeSchema>

export const DiaryEntrySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  practice_session_id: z.string().uuid(),       // v2.5: 归属到一次练习
  session_number: z.number().int().positive().nullable(),

  // v2 signature fields
  sensation_coord: SensationCoordSchema.nullable(),
  sensation_words: z.array(z.string()).default([]),
  activation_note: z.string().nullable(),
  // v2.7-A: 多选 pose
  pose_ids: z.array(z.string()).default([]),
  custom_pose_names: z.array(z.string()).default([]),
  photo_urls: z.array(z.string()).default([]),
  voice_url: z.string().nullable(),

  // v1 fields kept: some still useful in v2
  title: z.string(),                  // required in DB; v2 auto-generates
  content: z.string().nullable(),     // v2 "一句话" field
  activity_type: ActivityTypeSchema,
  activity_name: z.string().nullable(),
  duration_minutes: z.number().int().positive().nullable(),

  created_at: z.string(),
  updated_at: z.string(),
})

export type DiaryEntry = z.infer<typeof DiaryEntrySchema>

/**
 * Draft for a full record (primary or follow-up).
 * When creating primary entry (via createPracticeWithFirstEntry),
 *   activity_type is required + pose_id from user selection → seeds practice_session
 * When adding follow-up (via addFollowUpEntry / createEntry with practice_session_id),
 *   activity_type is inherited from practice_session (client can override).
 */
export const DiaryEntryDraftSchema = z.object({
  sensation_coord: SensationCoordSchema.nullable().optional(),
  sensation_words: z.array(z.string()).max(3).default([]),
  activation_note: z.string().nullable().optional(),
  // v2.7-A: 多选 pose（内置 pose id）+ 纯文字自定义名
  pose_ids: z.array(z.string()).default([]),
  custom_pose_names: z.array(z.string()).default([]),
  content: z.string().nullable().optional(),               // one-line note
  activity_type: ActivityTypeSchema.default('yoga_mat'),
  activity_name: z.string().nullable().optional(),
  duration_minutes: z.number().int().positive().nullable().optional(),
  photo_urls: z.array(z.string()).default([]),
  voice_url: z.string().nullable().optional(),
  title: z.string().optional(),                            // auto-generated if omitted
  // Attached annotations (created in same transaction after entry inserts)
  annotations: z.array(BodyAnnotationDraftSchema).default([]),
})

export type DiaryEntryDraft = z.infer<typeof DiaryEntryDraftSchema>

// ─── Practice session (v2.5) ────────────────────────────────────

export const PracticeSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  practice_number: z.number().int().positive(),
  activity_type: ActivityTypeSchema,
  activity_name: z.string().nullable(),
  // v2.7-A: 一次练习覆盖多个 pose
  pose_ids: z.array(z.string()).default([]),
  custom_pose_names: z.array(z.string()).default([]),
  practiced_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type PracticeSession = z.infer<typeof PracticeSessionSchema>

export const PracticeSessionPatchSchema = z.object({
  activity_type: ActivityTypeSchema.optional(),
  activity_name: z.string().nullable().optional(),
  pose_ids: z.array(z.string()).optional(),
  custom_pose_names: z.array(z.string()).optional(),
  practiced_at: z.string().optional(),
})

export type PracticeSessionPatch = z.infer<typeof PracticeSessionPatchSchema>

/**
 * Draft for creating a quick follow-up record (typically from practice-detail page).
 * All fields optional; must have at least one of activation_note or sensation_words.
 */
export const FollowUpEntryDraftSchema = z.object({
  activation_note: z.string().nullable().optional(),
  sensation_words: z.array(z.string()).max(3).default([]),
  annotations: z.array(BodyAnnotationDraftSchema).default([]),
})

export type FollowUpEntryDraft = z.infer<typeof FollowUpEntryDraftSchema>

// ─── User pose (v2.7-B · 用户自建 pose) ────────────────────────

export const UserPoseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  activity_type: ActivityTypeSchema,
  /** 家族标签（可空）——用户不确定分类时留空，picker 里归到"自定义"组 */
  family: z.string().nullable(),
  name_zh: z.string(),
  name_en: z.string().nullable(),
  main_muscle_ids: z.array(z.string()).default([]),
  activation_cue: z.string().nullable(),
  compensation: z.string().nullable(),
  sensation_words: z.array(z.string()).default([]),
  /** Sprint 3 才做图片上传，先 nullable */
  image_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type UserPose = z.infer<typeof UserPoseSchema>

/** Draft for creating a new user_pose */
export const UserPoseDraftSchema = z.object({
  activity_type: ActivityTypeSchema,
  family: z.string().nullable().optional(),
  name_zh: z.string().min(1),
  name_en: z.string().nullable().optional(),
  main_muscle_ids: z.array(z.string()).default([]),
  activation_cue: z.string().nullable().optional(),
  compensation: z.string().nullable().optional(),
  sensation_words: z.array(z.string()).default([]),
  image_url: z.string().nullable().optional(),
})

export type UserPoseDraft = z.infer<typeof UserPoseDraftSchema>

export const UserPosePatchSchema = UserPoseDraftSchema.partial()
export type UserPosePatch = z.infer<typeof UserPosePatchSchema>

// ─── Profile (v1 shape; v2 doesn't add DB columns) ─────────────

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  wechat_openid: z.string().nullable(),
  nickname: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type Profile = z.infer<typeof ProfileSchema>
