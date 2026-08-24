// @body-diary/core · Diary entry CRUD + business logic
// Every function takes a supabase client explicitly — no module-level singleton
// so multiple clients (e.g. tests + app) can coexist.

import type { BodyDiarySupabaseClient } from './client'
import type {
  DiaryEntry,
  DiaryEntryDraft,
  BodyAnnotation,
  BodyAnnotationDraft,
} from './schemas'
import { getPoseById } from '@body-diary/content'

// ─── Draft → title / activity_name defaults ────────────────────

/**
 * Auto-generate a title for v2 entries when the user didn't provide one.
 * Format: `{firstPoseName / 记录} · MM.DD`
 * v2.7-A: pose 多选后，取第一个 pose 作为 title 标识；custom name 兜底。
 */
export function generateEntryTitle(
  draft: Pick<DiaryEntryDraft, 'pose_ids' | 'custom_pose_names' | 'title'>,
  date: Date = new Date(),
): string {
  if (draft.title && draft.title.trim().length > 0) return draft.title.trim()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const firstPoseId = draft.pose_ids?.[0]
  const firstCustom = draft.custom_pose_names?.[0]?.trim()
  const label =
    (firstPoseId && getPoseById(firstPoseId)?.nameZh) ||
    firstCustom ||
    '记录'
  return `${label} · ${mm}.${dd}`
}

// ─── Create ────────────────────────────────────────────────────

/**
 * Low-level: insert an entry into an existing practice_session.
 * Most callers should use `createPracticeWithFirstEntry` (new practice) or
 * `addFollowUpEntry` (subsequent record) from ./practices.ts instead.
 */
export async function createEntry(
  client: BodyDiarySupabaseClient,
  userId: string,
  practiceSessionId: string,
  draft: DiaryEntryDraft,
): Promise<{ entry: DiaryEntry; annotations: BodyAnnotation[] }> {
  // 1. Next session_number
  const { data: nextNum, error: rpcErr } = await client.rpc('next_session_number', {
    p_user_id: userId,
  })
  if (rpcErr) throw rpcErr
  const session_number = nextNum ?? 1

  // 2. INSERT entry
  const title = generateEntryTitle(draft)
  const activity_type = draft.activity_type ?? 'yoga_mat'
  const insertRow = {
    user_id: userId,
    practice_session_id: practiceSessionId,
    session_number,
    sensation_coord: draft.sensation_coord ?? null,
    sensation_words: draft.sensation_words ?? [],
    activation_note: draft.activation_note ?? null,
    pose_ids: draft.pose_ids ?? [],
    custom_pose_names: draft.custom_pose_names ?? [],
    content: draft.content ?? null,
    activity_type,
    activity_name: draft.activity_name ?? null,
    duration_minutes: draft.duration_minutes ?? null,
    photo_urls: draft.photo_urls ?? [],
    voice_url: draft.voice_url ?? null,
    title,
  }
  const { data: entry, error: insertErr } = await client
    .from('diary_entries')
    .insert(insertRow)
    .select('*')
    .single()
  if (insertErr) throw insertErr
  if (!entry) throw new Error('createEntry: no row returned from insert')

  // 3. INSERT annotations
  const annotations: BodyAnnotation[] = []
  if (draft.annotations && draft.annotations.length > 0) {
    const rows = draft.annotations.map((a) => ({
      entry_id: entry.id,
      user_id: userId,
      muscle_asset_id: a.muscle_asset_id,
      sensation: a.sensation,
      note: a.note ?? null,
      pose_id: a.pose_id ?? null,
    }))
    const { data: annRows, error: annErr } = await client
      .from('body_annotations')
      .insert(rows)
      .select('*')
    if (annErr) throw annErr
    if (annRows) annotations.push(...(annRows as BodyAnnotation[]))
  }

  return { entry: entry as DiaryEntry, annotations }
}

// ─── Read ──────────────────────────────────────────────────────

export async function getEntry(
  client: BodyDiarySupabaseClient,
  entryId: string,
): Promise<DiaryEntry | null> {
  const { data, error } = await client
    .from('diary_entries')
    .select('*')
    .eq('id', entryId)
    .maybeSingle()
  if (error) throw error
  return (data as DiaryEntry | null) ?? null
}

export interface ListEntriesOptions {
  /** Max rows to return. Default 20. */
  limit?: number
  /** Skip this many rows (for pagination). Default 0. */
  offset?: number
  /** Return entries created on or after this date. */
  since?: Date
  /** Return entries created before this date. */
  until?: Date
}

export async function listEntries(
  client: BodyDiarySupabaseClient,
  userId: string,
  opts: ListEntriesOptions = {},
): Promise<DiaryEntry[]> {
  const limit = opts.limit ?? 20
  const offset = opts.offset ?? 0
  let q = client
    .from('diary_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (opts.since) q = q.gte('created_at', opts.since.toISOString())
  if (opts.until) q = q.lt('created_at', opts.until.toISOString())
  const { data, error } = await q
  if (error) throw error
  return (data as DiaryEntry[]) ?? []
}

/** Get the most recent entry for home page "上一次练习" card. */
export async function getPreviousEntry(
  client: BodyDiarySupabaseClient,
  userId: string,
): Promise<DiaryEntry | null> {
  const { data, error } = await client
    .from('diary_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as DiaryEntry | null) ?? null
}

/** Get entries for a specific pose (used in pose detail "我的历史感受"). */
export async function listEntriesForPose(
  client: BodyDiarySupabaseClient,
  userId: string,
  poseId: string,
): Promise<DiaryEntry[]> {
  // v2.7-A: pose_ids 是数组，用 contains （@>) 查询
  const { data, error } = await client
    .from('diary_entries')
    .select('*')
    .eq('user_id', userId)
    .contains('pose_ids', [poseId])
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as DiaryEntry[]) ?? []
}

// ─── Update ────────────────────────────────────────────────────

export type DiaryEntryPatch = Partial<
  Pick<
    DiaryEntry,
    | 'sensation_coord'
    | 'sensation_words'
    | 'activation_note'
    | 'pose_ids'
    | 'custom_pose_names'
    | 'content'
    | 'activity_type'
    | 'activity_name'
    | 'duration_minutes'
    | 'photo_urls'
    | 'voice_url'
    | 'title'
  >
>

export async function updateEntry(
  client: BodyDiarySupabaseClient,
  entryId: string,
  patch: DiaryEntryPatch,
): Promise<DiaryEntry> {
  const { data, error } = await client
    .from('diary_entries')
    .update(patch)
    .eq('id', entryId)
    .select('*')
    .single()
  if (error) throw error
  if (!data) throw new Error('updateEntry: no row returned')
  return data as DiaryEntry
}

// ─── Delete ────────────────────────────────────────────────────

/** Cascades to body_annotations via FK ON DELETE CASCADE. */
export async function deleteEntry(
  client: BodyDiarySupabaseClient,
  entryId: string,
): Promise<void> {
  const { error } = await client.from('diary_entries').delete().eq('id', entryId)
  if (error) throw error
}

// ─── Client-side session number fallback ───────────────────────

/**
 * Compute next session number without RPC (fallback if RPC unavailable).
 * Race-condition-vulnerable; only use when the SQL function isn't callable.
 */
export async function nextSessionNumberClientSide(
  client: BodyDiarySupabaseClient,
  userId: string,
): Promise<number> {
  const { data, error } = await client
    .from('diary_entries')
    .select('session_number')
    .eq('user_id', userId)
    .order('session_number', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data?.session_number ?? 0) + 1
}
