// @body-diary/core · Storage helpers for entry-media bucket
// Path convention: entry-media/{user_id}/{entry_id}/{filename}
// This convention is enforced by the Storage RLS policies (see migration 013).

import type { BodyDiarySupabaseClient } from './client'

export const ENTRY_MEDIA_BUCKET = 'entry-media'

/** Build a canonical object path for an entry media file. */
export function buildEntryMediaPath(
  userId: string,
  entryId: string,
  filename: string,
): string {
  return `${userId}/${entryId}/${filename}`
}

// ─── Upload ────────────────────────────────────────────────────

export interface UploadEntryMediaOptions {
  /** Content type — required for browser uploads to be usable. */
  contentType?: string
  /** Whether to overwrite existing file with same path. Default false. */
  upsert?: boolean
}

/**
 * Upload a file (image / audio / etc) to the entry-media bucket.
 * Returns the object path (not a URL — use `getSignedEntryMediaUrl` to fetch).
 */
export async function uploadEntryMedia(
  client: BodyDiarySupabaseClient,
  userId: string,
  entryId: string,
  filename: string,
  file: Blob | ArrayBuffer | Uint8Array,
  opts: UploadEntryMediaOptions = {},
): Promise<string> {
  const path = buildEntryMediaPath(userId, entryId, filename)
  const { error } = await client.storage
    .from(ENTRY_MEDIA_BUCKET)
    .upload(path, file, {
      contentType: opts.contentType,
      upsert: opts.upsert ?? false,
    })
  if (error) throw error
  return path
}

// ─── Read (signed URL for private bucket) ─────────────────────

/**
 * Get a time-limited signed URL for an entry-media object.
 * Private bucket, so raw URLs won't work — signed URL is the only read path.
 */
export async function getSignedEntryMediaUrl(
  client: BodyDiarySupabaseClient,
  objectPath: string,
  expiresInSec: number = 3600,
): Promise<string> {
  const { data, error } = await client.storage
    .from(ENTRY_MEDIA_BUCKET)
    .createSignedUrl(objectPath, expiresInSec)
  if (error) throw error
  if (!data?.signedUrl) throw new Error('getSignedEntryMediaUrl: no URL returned')
  return data.signedUrl
}

/**
 * Get signed URLs for many objects at once (e.g. rendering a diary card with N photos).
 * Preserves input order; failed entries become `null`.
 */
export async function getSignedEntryMediaUrls(
  client: BodyDiarySupabaseClient,
  objectPaths: readonly string[],
  expiresInSec: number = 3600,
): Promise<(string | null)[]> {
  if (objectPaths.length === 0) return []
  const { data, error } = await client.storage
    .from(ENTRY_MEDIA_BUCKET)
    .createSignedUrls([...objectPaths], expiresInSec)
  if (error) throw error
  return (data ?? []).map((d) => d.signedUrl || null)
}

// ─── Delete ────────────────────────────────────────────────────

export async function deleteEntryMedia(
  client: BodyDiarySupabaseClient,
  objectPath: string,
): Promise<void> {
  const { error } = await client.storage
    .from(ENTRY_MEDIA_BUCKET)
    .remove([objectPath])
  if (error) throw error
}

export async function deleteEntryMediaBatch(
  client: BodyDiarySupabaseClient,
  objectPaths: readonly string[],
): Promise<void> {
  if (objectPaths.length === 0) return
  const { error } = await client.storage
    .from(ENTRY_MEDIA_BUCKET)
    .remove([...objectPaths])
  if (error) throw error
}
