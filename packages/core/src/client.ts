// @body-diary/core · Supabase client factory
// Cross-platform: works in H5 (browser fetch), Taro小程序 (Taro.request → fetch shim), Node (tests).
// Apps pass in their env (URL + anon key) at boot.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export interface SupabaseConfig {
  url: string
  anonKey: string
  /** Optional custom fetch (needed for RN / non-browser envs). */
  fetch?: typeof fetch
}

/** Type alias for our typed Supabase client. Import from here throughout apps. */
export type BodyDiarySupabaseClient = SupabaseClient<Database>

/**
 * Create a typed Supabase client bound to our Database schema.
 * Call once at app boot; hold the returned client in a singleton / store.
 */
export function createSupabaseClient(config: SupabaseConfig): BodyDiarySupabaseClient {
  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      // Small mobile-first defaults. Apps can override by wrapping this.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // MP端没有 URL 会话回调
    },
    global: config.fetch ? { fetch: config.fetch } : undefined,
  })
}

// Re-export commonly needed Supabase types for convenience.
export type { SupabaseClient, PostgrestError, User, Session } from '@supabase/supabase-js'
export type { Database } from './database.types'
