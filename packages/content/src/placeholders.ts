// Record page "一句话（可选）" field placeholder rotation.
// PRD § 4.1: fixed hint for first 3 records, random rotation from 4th on.

export const RECORD_PLACEHOLDER_NEW_USER = '记下老师说的发力点，或今天最清晰的感受。'

export const RECORD_PLACEHOLDER_POOL: readonly string[] = [
  '哪里的发力最清晰？',
  '哪里最模糊？',
  '今天想留下什么？',
  '老师说的哪句话让你有感？',
  '身体在提醒你什么？',
  '今天你和身体的对话是什么？',
] as const

/** Threshold — first N records show the fixed new-user hint. */
export const NEW_USER_RECORD_THRESHOLD = 3

/**
 * Get the placeholder for the record page's "一句话" field.
 *
 * @param sessionNumber — 1-indexed count of records the user has made (or is about to make).
 *   ≤ 3: return the fixed new-user hint (reinforces "what to record" concept).
 *   ≥ 4: return a random hint from the pool.
 */
export function pickRecordPlaceholder(sessionNumber: number): string {
  if (sessionNumber <= NEW_USER_RECORD_THRESHOLD) return RECORD_PLACEHOLDER_NEW_USER
  return RECORD_PLACEHOLDER_POOL[Math.floor(Math.random() * RECORD_PLACEHOLDER_POOL.length)]
}
