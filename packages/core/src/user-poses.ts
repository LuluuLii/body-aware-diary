// @body-diary/core · user_poses CRUD
// v2.7-B: 用户自建 pose 的持久层。
// 前端在 pose picker / poses gallery 里把它们跟内置 POSES 合并显示。

import type { BodyDiarySupabaseClient } from './client'
import type {
  UserPose,
  UserPoseDraft,
  UserPosePatch,
} from './schemas'

// ─── Create ────────────────────────────────────────────────────

export async function createUserPose(
  client: BodyDiarySupabaseClient,
  userId: string,
  draft: UserPoseDraft,
): Promise<UserPose> {
  const row = {
    user_id: userId,
    activity_type: draft.activity_type,
    family: draft.family ?? null,
    name_zh: draft.name_zh.trim(),
    name_en: draft.name_en?.trim() || null,
    main_muscle_ids: draft.main_muscle_ids ?? [],
    activation_cue: draft.activation_cue?.trim() || null,
    compensation: draft.compensation?.trim() || null,
    sensation_words: draft.sensation_words ?? [],
    image_url: draft.image_url ?? null,
  }
  const { data, error } = await client
    .from('user_poses')
    .insert(row)
    .select('*')
    .single()
  if (error) throw error
  if (!data) throw new Error('createUserPose: no row returned')
  return data as UserPose
}

// ─── Read ──────────────────────────────────────────────────────

export async function getUserPose(
  client: BodyDiarySupabaseClient,
  poseId: string,
): Promise<UserPose | null> {
  const { data, error } = await client
    .from('user_poses')
    .select('*')
    .eq('id', poseId)
    .maybeSingle()
  if (error) throw error
  return (data as UserPose | null) ?? null
}

/** List all user_poses for a user. Cheap to call — cache in Zustand at app-level. */
export async function listUserPoses(
  client: BodyDiarySupabaseClient,
  userId: string,
): Promise<UserPose[]> {
  const { data, error } = await client
    .from('user_poses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as UserPose[]) ?? []
}

// ─── Update ────────────────────────────────────────────────────

export async function updateUserPose(
  client: BodyDiarySupabaseClient,
  poseId: string,
  patch: UserPosePatch,
): Promise<UserPose> {
  const { data, error } = await client
    .from('user_poses')
    .update(patch)
    .eq('id', poseId)
    .select('*')
    .single()
  if (error) throw error
  if (!data) throw new Error('updateUserPose: no row returned')
  return data as UserPose
}

// ─── Delete ────────────────────────────────────────────────────

export async function deleteUserPose(
  client: BodyDiarySupabaseClient,
  poseId: string,
): Promise<void> {
  const { error } = await client.from('user_poses').delete().eq('id', poseId)
  if (error) throw error
}
