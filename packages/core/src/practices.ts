// @body-diary/core · Practice session CRUD + composite create flows
// v2.5: practice_sessions 是 diary_entries 的父实体。每次练习 1..N 条记录。

import type { BodyDiarySupabaseClient } from './client'
import { generateEntryTitle } from './entries'
import type {
  BodyAnnotation,
  DiaryEntry,
  DiaryEntryDraft,
  FollowUpEntryDraft,
  PracticeSession,
  PracticeSessionPatch,
} from './schemas'

// ─── Read ──────────────────────────────────────────────────────

export async function getPractice(
  client: BodyDiarySupabaseClient,
  practiceId: string,
): Promise<PracticeSession | null> {
  const { data, error } = await client
    .from('practice_sessions')
    .select('*')
    .eq('id', practiceId)
    .maybeSingle()
  if (error) throw error
  return (data as PracticeSession | null) ?? null
}

export interface ListPracticesOptions {
  limit?: number
  offset?: number
}

export async function listPractices(
  client: BodyDiarySupabaseClient,
  userId: string,
  opts: ListPracticesOptions = {},
): Promise<PracticeSession[]> {
  const limit = opts.limit ?? 20
  const offset = opts.offset ?? 0
  const { data, error } = await client
    .from('practice_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('practiced_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw error
  return (data as PracticeSession[]) ?? []
}

/** Latest practice — for home "上一次练习" card. */
export async function getLatestPractice(
  client: BodyDiarySupabaseClient,
  userId: string,
): Promise<PracticeSession | null> {
  const { data, error } = await client
    .from('practice_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('practiced_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as PracticeSession | null) ?? null
}

/** All entries under one practice (chronological order). */
export async function listEntriesInPractice(
  client: BodyDiarySupabaseClient,
  practiceId: string,
): Promise<DiaryEntry[]> {
  const { data, error } = await client
    .from('diary_entries')
    .select('*')
    .eq('practice_session_id', practiceId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as DiaryEntry[]) ?? []
}

// ─── Create: composite "new practice + first entry" ────────────

/**
 * Create a new practice_session AND its first (primary) entry in one flow.
 * This is the entry point from the record page: user taps ＋, fills draft, submits.
 *
 * Steps:
 *   1. RPC next_practice_number(user_id) → 第 N 次练习
 *   2. INSERT practice_sessions (from draft fields)
 *   3. RPC next_session_number(user_id) → 第 N 条记录
 *   4. INSERT diary_entries (with practice_session_id set)
 *   5. INSERT body_annotations
 */
export async function createPracticeWithFirstEntry(
  client: BodyDiarySupabaseClient,
  userId: string,
  draft: DiaryEntryDraft,
): Promise<{ practice: PracticeSession; entry: DiaryEntry; annotations: BodyAnnotation[] }> {
  // 1. Next practice_number
  const { data: nextPn, error: pnErr } = await client.rpc('next_practice_number', { p_user_id: userId })
  if (pnErr) throw pnErr
  const practice_number = nextPn ?? 1

  // 2. INSERT practice
  const practiceRow = {
    user_id: userId,
    practice_number,
    activity_type: draft.activity_type ?? 'yoga_mat',
    activity_name: draft.activity_name ?? null,
    pose_ids: draft.pose_ids ?? [],
    custom_pose_names: draft.custom_pose_names ?? [],
  }
  const { data: practice, error: pErr } = await client
    .from('practice_sessions')
    .insert(practiceRow)
    .select('*')
    .single()
  if (pErr) throw pErr
  if (!practice) throw new Error('createPracticeWithFirstEntry: practice insert returned nothing')

  // 3. Next session_number (跨全部 entries 的第 N 条)
  const { data: nextSn, error: snErr } = await client.rpc('next_session_number', { p_user_id: userId })
  if (snErr) throw snErr
  const session_number = nextSn ?? 1

  // 4. INSERT entry
  const title = generateEntryTitle(draft)
  const entryRow = {
    user_id: userId,
    practice_session_id: (practice as PracticeSession).id,
    session_number,
    sensation_coord: draft.sensation_coord ?? null,
    sensation_words: draft.sensation_words ?? [],
    activation_note: draft.activation_note ?? null,
    pose_ids: draft.pose_ids ?? [],
    custom_pose_names: draft.custom_pose_names ?? [],
    content: draft.content ?? null,
    activity_type: draft.activity_type ?? 'yoga_mat',
    activity_name: draft.activity_name ?? null,
    duration_minutes: draft.duration_minutes ?? null,
    photo_urls: draft.photo_urls ?? [],
    voice_url: draft.voice_url ?? null,
    title,
  }
  const { data: entry, error: eErr } = await client
    .from('diary_entries')
    .insert(entryRow)
    .select('*')
    .single()
  if (eErr) throw eErr
  if (!entry) throw new Error('createPracticeWithFirstEntry: entry insert returned nothing')

  // 5. INSERT annotations
  const annotations: BodyAnnotation[] = []
  if (draft.annotations && draft.annotations.length > 0) {
    const annRows = draft.annotations.map((a) => ({
      entry_id: (entry as DiaryEntry).id,
      user_id: userId,
      muscle_asset_id: a.muscle_asset_id,
      sensation: a.sensation,
      note: a.note ?? null,
      pose_id: a.pose_id ?? null,
    }))
    const { data: annRes, error: annErr } = await client
      .from('body_annotations')
      .insert(annRows)
      .select('*')
    if (annErr) throw annErr
    if (annRes) annotations.push(...(annRes as BodyAnnotation[]))
  }

  return {
    practice: practice as PracticeSession,
    entry: entry as DiaryEntry,
    annotations,
  }
}

// ─── Follow-up entry (light quick-add from practice-detail page) ──

/**
 * Add a follow-up record to an existing practice.
 * Simpler than createPracticeWithFirstEntry: only accepts a few essential fields.
 * Inherits activity_type / pose from parent practice.
 */
export async function addFollowUpEntry(
  client: BodyDiarySupabaseClient,
  userId: string,
  practiceId: string,
  draft: FollowUpEntryDraft,
): Promise<{ entry: DiaryEntry; annotations: BodyAnnotation[] }> {
  // Look up parent practice for inheritance
  const practice = await getPractice(client, practiceId)
  if (!practice) throw new Error(`addFollowUpEntry: practice ${practiceId} not found`)

  // Next session_number
  const { data: nextSn, error: snErr } = await client.rpc('next_session_number', { p_user_id: userId })
  if (snErr) throw snErr
  const session_number = nextSn ?? 1

  const title = generateEntryTitle({
    pose_ids: practice.pose_ids,
    custom_pose_names: practice.custom_pose_names,
  }, new Date())

  const entryRow = {
    user_id: userId,
    practice_session_id: practiceId,
    session_number,
    sensation_coord: null,
    sensation_words: draft.sensation_words ?? [],
    activation_note: draft.activation_note ?? null,
    // follow-up 继承 practice 的 pose 集合（不 mutate）
    pose_ids: practice.pose_ids,
    custom_pose_names: practice.custom_pose_names,
    content: null,
    activity_type: practice.activity_type,
    activity_name: practice.activity_name,
    duration_minutes: null,
    photo_urls: [],
    voice_url: null,
    title,
  }
  const { data: entry, error: eErr } = await client
    .from('diary_entries')
    .insert(entryRow)
    .select('*')
    .single()
  if (eErr) throw eErr
  if (!entry) throw new Error('addFollowUpEntry: entry insert returned nothing')

  const annotations: BodyAnnotation[] = []
  if (draft.annotations && draft.annotations.length > 0) {
    const annRows = draft.annotations.map((a) => ({
      entry_id: (entry as DiaryEntry).id,
      user_id: userId,
      muscle_asset_id: a.muscle_asset_id,
      sensation: a.sensation,
      note: a.note ?? null,
    }))
    const { data: annRes, error: annErr } = await client
      .from('body_annotations')
      .insert(annRows)
      .select('*')
    if (annErr) throw annErr
    if (annRes) annotations.push(...(annRes as BodyAnnotation[]))
  }

  return { entry: entry as DiaryEntry, annotations }
}

// ─── Update / delete ──────────────────────────────────────────

export async function updatePractice(
  client: BodyDiarySupabaseClient,
  practiceId: string,
  patch: PracticeSessionPatch,
): Promise<PracticeSession> {
  const { data, error } = await client
    .from('practice_sessions')
    .update(patch)
    .eq('id', practiceId)
    .select('*')
    .single()
  if (error) throw error
  if (!data) throw new Error('updatePractice: no row returned')
  return data as PracticeSession
}

export async function deletePractice(
  client: BodyDiarySupabaseClient,
  practiceId: string,
): Promise<void> {
  // Cascade will delete all diary_entries under this practice.
  const { error } = await client.from('practice_sessions').delete().eq('id', practiceId)
  if (error) throw error
}
