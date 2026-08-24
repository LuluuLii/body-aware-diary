// @body-diary/core · Body annotation queries (muscle-level v2)
// Annotations are created via `createEntry` in ./entries.ts (transactional-ish).
// This module provides read/query/aggregation helpers used by review + detail pages.

import type { BodyDiarySupabaseClient } from './client'
import type { BodyAnnotation, MuscleSensationTag } from './schemas'

// ─── Read ──────────────────────────────────────────────────────

/** All annotations attached to a single entry (record detail page). */
export async function listAnnotationsForEntry(
  client: BodyDiarySupabaseClient,
  entryId: string,
): Promise<BodyAnnotation[]> {
  const { data, error } = await client
    .from('body_annotations')
    .select('*')
    .eq('entry_id', entryId)
    .not('muscle_asset_id', 'is', null) // v2 only
  if (error) throw error
  return (data as BodyAnnotation[]) ?? []
}

/**
 * All annotations for a specific muscle (肌肉详情页历史).
 * Ordered by created_at DESC.
 */
export async function listAnnotationsForMuscle(
  client: BodyDiarySupabaseClient,
  userId: string,
  muscleAssetId: string,
  opts: { limit?: number; since?: Date } = {},
): Promise<BodyAnnotation[]> {
  let q = client
    .from('body_annotations')
    .select('*')
    .eq('user_id', userId)
    .eq('muscle_asset_id', muscleAssetId)
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 50)
  if (opts.since) q = q.gte('created_at', opts.since.toISOString())
  const { data, error } = await q
  if (error) throw error
  return (data as BodyAnnotation[]) ?? []
}

// ─── Aggregations for review page ─────────────────────────────

export interface MuscleFrequency {
  muscle_asset_id: string
  count: number
  /** How often each sensation tag appears for this muscle. */
  by_tag: Record<MuscleSensationTag, number>
}

/**
 * "哪个部位在反复提醒你" — frequency of each muscle annotation over a date range.
 * Returns array sorted by count DESC.
 *
 * Pulls raw rows and aggregates client-side (simple, correct, fine for MVP volumes).
 * For long time ranges with many users, replace with a DB view or materialized query.
 */
export async function getMuscleFrequency(
  client: BodyDiarySupabaseClient,
  userId: string,
  since: Date,
  until: Date = new Date(),
): Promise<MuscleFrequency[]> {
  const { data, error } = await client
    .from('body_annotations')
    .select('muscle_asset_id, sensation')
    .eq('user_id', userId)
    .not('muscle_asset_id', 'is', null)
    .gte('created_at', since.toISOString())
    .lt('created_at', until.toISOString())
  if (error) throw error

  const byMuscle = new Map<string, MuscleFrequency>()
  for (const row of data ?? []) {
    const id = row.muscle_asset_id
    if (!id) continue
    const tag = row.sensation as MuscleSensationTag
    let entry = byMuscle.get(id)
    if (!entry) {
      entry = {
        muscle_asset_id: id,
        count: 0,
        by_tag: {
          soreness: 0, tightness: 0, warmth: 0, swell: 0, none: 0,
        },
      }
      byMuscle.set(id, entry)
    }
    entry.count += 1
    if (entry.by_tag[tag] !== undefined) entry.by_tag[tag] += 1
  }

  return Array.from(byMuscle.values()).sort((a, b) => b.count - a.count)
}

// ─── Individual annotation update / delete ────────────────────

export async function updateAnnotation(
  client: BodyDiarySupabaseClient,
  annotationId: string,
  patch: Partial<Pick<BodyAnnotation, 'sensation' | 'note'>>,
): Promise<BodyAnnotation> {
  const { data, error } = await client
    .from('body_annotations')
    .update(patch)
    .eq('id', annotationId)
    .select('*')
    .single()
  if (error) throw error
  if (!data) throw new Error('updateAnnotation: no row returned')
  return data as BodyAnnotation
}

export async function deleteAnnotation(
  client: BodyDiarySupabaseClient,
  annotationId: string,
): Promise<void> {
  const { error } = await client.from('body_annotations').delete().eq('id', annotationId)
  if (error) throw error
}

/**
 * Delete all annotations for an entry. Used when editing an entry — replace all
 * annotations rather than diff (v2 数据量小, simple + safe).
 */
export async function deleteAllAnnotationsForEntry(
  client: BodyDiarySupabaseClient,
  entryId: string,
): Promise<void> {
  const { error } = await client.from('body_annotations').delete().eq('entry_id', entryId)
  if (error) throw error
}

/**
 * Batch insert annotation drafts for an entry.
 * Used together with deleteAllAnnotationsForEntry for "replace all" edit flow.
 */
export async function bulkInsertAnnotations(
  client: BodyDiarySupabaseClient,
  entryId: string,
  userId: string,
  drafts: readonly {
    muscle_asset_id: string
    sensation: string
    note?: string | null
    pose_id?: string | null
  }[],
): Promise<BodyAnnotation[]> {
  if (drafts.length === 0) return []
  const rows = drafts.map((a) => ({
    entry_id: entryId,
    user_id: userId,
    muscle_asset_id: a.muscle_asset_id,
    sensation: a.sensation,
    note: a.note ?? null,
    pose_id: a.pose_id ?? null,
  }))
  const { data, error } = await client
    .from('body_annotations')
    .insert(rows as any)
    .select('*')
  if (error) throw error
  return (data as BodyAnnotation[]) ?? []
}
