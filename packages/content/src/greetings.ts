// Home page greeting copy (Serif 30px title + 14px subtitle).
// Rotates by time-of-day + random pick from candidates.

export type TimeContext = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night' | 'any'

export interface Greeting {
  title: string
  subtitle: string
  timeContext: TimeContext
}

export const GREETINGS: readonly Greeting[] = [
  { title: '早上好，慢慢开始。',       subtitle: '身体还在苏醒，别急。',                 timeContext: 'morning' },
  { title: '午后好，慢下来一点。',     subtitle: '这一天走到一半了，问问自己。',           timeContext: 'afternoon' },
  { title: '傍晚了，落地一下。',       subtitle: '一整天累积的紧，留个位置放它。',         timeContext: 'evening' },
  { title: '夜深了，收拾一下自己。',   subtitle: '不用急着睡，先听听身体。',               timeContext: 'night' },
  { title: '嘿，回来了。',             subtitle: '好久不见。上次你留下的还在。',           timeContext: 'any' },
  { title: '今天想留下什么？',         subtitle: '任何一小点都可以。',                     timeContext: 'any' },
  { title: '中午好，喘口气。',         subtitle: '身体想说什么？',                         timeContext: 'noon' },
] as const

// ─── Helpers ────────────────────────────────────────────

/** Local-time hour → time context bucket. */
export function getTimeContext(date: Date = new Date()): TimeContext {
  const h = date.getHours()
  if (h < 6)  return 'night'
  if (h < 11) return 'morning'
  if (h < 14) return 'noon'
  if (h < 18) return 'afternoon'
  if (h < 22) return 'evening'
  return 'night'
}

/**
 * Pick a greeting for the given time.
 * Combines time-specific candidates with `any`-context ones, then random-picks.
 * Callers should memoize per session so it doesn't change on every render.
 */
export function pickGreeting(date: Date = new Date()): Greeting {
  const context = getTimeContext(date)
  const candidates = GREETINGS.filter((g) => g.timeContext === context || g.timeContext === 'any')
  return candidates[Math.floor(Math.random() * candidates.length)]
}
