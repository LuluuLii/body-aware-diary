// @body-diary/core · Profile CRUD
// Note: theme_preference and onboarding_seen were REMOVED from the profiles table
// (see architecture memory) — those live client-side only. This module handles the
// remote nickname/avatar/wechat_openid part.

import type { BodyDiarySupabaseClient } from './client'
import type { Profile } from './schemas'

export async function getProfile(
  client: BodyDiarySupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await client
    .from('profiles')
    .select('id, wechat_openid, nickname, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return (data as Profile | null) ?? null
}

/**
 * Ensure a profile row exists for a signed-in user.
 * Idempotent — check-then-insert with unique-violation as success signal.
 *
 * Why not `.upsert(..., { ignoreDuplicates: true })`: supabase-js's upsert
 * translates to `POST ... on_conflict=id` which returns 409 if the row already
 * exists (from e.g. a Supabase auth.users → profiles trigger), even with the
 * ignoreDuplicates preference. Fetching first avoids the surprise.
 */
export async function ensureProfile(
  client: BodyDiarySupabaseClient,
  userId: string,
): Promise<Profile> {
  // 1) Try to fetch existing profile
  const existing = await getProfile(client, userId)
  if (existing) return existing

  // 2) Not there — insert
  const { error: insertError } = await client
    .from('profiles')
    .insert({ id: userId })
  // 23505 = unique_violation — another concurrent insert won the race, fine.
  if (insertError && insertError.code !== '23505') throw insertError

  // 3) Re-fetch
  const created = await getProfile(client, userId)
  if (!created) {
    throw new Error(
      `ensureProfile: profile row not found after insert (user ${userId}). ` +
      `Check RLS SELECT policy on public.profiles.`
    )
  }
  return created
}

export type ProfilePatch = Partial<Pick<Profile, 'nickname' | 'avatar_url'>>

export async function updateProfile(
  client: BodyDiarySupabaseClient,
  userId: string,
  patch: ProfilePatch,
): Promise<Profile> {
  const { data, error } = await client
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('id, wechat_openid, nickname, avatar_url, created_at, updated_at')
    .single()
  if (error) throw error
  return data as Profile
}

// ─── Client-side profile state (theme + onboarding) ────────────

/**
 * Theme preference — one of two values.
 * Stored client-side (localStorage / wx.setStorage).
 */
export type Theme = 'fresh' | 'earth'

/**
 * Onboarding tip ids the user has already seen.
 * Kept client-side; a new device = re-see the tips. That's OK (低成本重复).
 */
export const ONBOARDING_IDS = ['record', 'bodymap_annotate', 'pose_detail'] as const
export type OnboardingId = typeof ONBOARDING_IDS[number]

/**
 * Interface for the client-side settings store. Each app implements this using
 * its platform storage:
 *   - Taro小程序 / H5: `Taro.getStorageSync` / `Taro.setStorageSync`
 *   - Web (Next.js): `localStorage`
 *   - iOS: `UserDefaults`
 */
export interface ClientSettingsStore {
  getTheme(): Theme
  setTheme(theme: Theme): void
  getOnboardingSeen(): OnboardingId[]
  markOnboardingSeen(id: OnboardingId): void
  resetOnboarding(): void
}

/** Standard storage keys — apps use these to key their platform storage. */
export const CLIENT_SETTINGS_KEYS = {
  theme: 'body-diary.theme',
  onboardingSeen: 'body-diary.onboarding-seen',
} as const
