// @body-diary/core · main entry
// Data model, Supabase client, and business logic. Cross-platform (no Taro/browser deps).

export * from './client'
export * from './schemas'
export * from './entries'
export * from './annotations'
export * from './profile'
export * from './storage'
export * from './practices'
export * from './user-poses'

// Re-export the generated Database type separately so consumers can reference
// it explicitly, e.g. for building custom queries.
export type { Database } from './database.types'
