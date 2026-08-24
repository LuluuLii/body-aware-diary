// 通用格式化 / 映射 helpers。跨端 (小程序端也 OK，不依赖 DOM)。

import type { MuscleSensationTag, ActivityType } from '@body-diary/core'

// ─── Sensation tag → CSS var 颜色映射 ────────────────────────

export const SENSATION_CSS_VAR: Record<MuscleSensationTag, string> = {
  soreness:  'var(--sensation-sour)',
  tightness: 'var(--sensation-tight)',
  warmth:    'var(--sensation-warm)',
  swell:     'var(--sensation-swell)',
  none:      'var(--sensation-none)',
}

// ─── ActivityType → 中文标签 ─────────────────────────────────
// v2.6: 合并 yoga+pilates 为 yoga_mat；dance 收窄为 ballet；去掉暂未做的四个类目。

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  yoga_mat:       '垫上',
  ballet:         '芭蕾',
  swimming:       '游泳',
  strength:       '力量',
  running:        '跑步',
  cycling:        '骑行',
  hiking:         '徒步',
  rehabilitation: '康复',
  other:          '其他',
}

/**
 * 品类下"具体做了什么"字段的通名。记录页需要联动展示：
 * 选芭蕾时"选动作"，选游泳时"选泳姿"，选垫上时"选体式"…
 */
export const POSE_NOUN_BY_ACTIVITY: Record<ActivityType, string> = {
  yoga_mat:       '体式',
  ballet:         '动作',
  swimming:       '泳姿',
  strength:       '动作',
  running:        '训练',
  cycling:        '训练',
  hiking:         '训练',
  rehabilitation: '训练',
  other:          '项目',
}

// ─── 日期格式化 ─────────────────────────────────────────────

/** "2026 · 07 · 24" - top-of-page handwritten date */
export function formatHandwrittenDate(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y} · ${m} · ${d}`
}

/** "07.24" - short handwritten (for cards) */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${m}.${day}`
}

/** "Sunday · July 24" - latin small header */
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']

export function formatLatinHeader(date: Date = new Date()): string {
  return `${WEEKDAYS_EN[date.getDay()]} · ${MONTHS_EN[date.getMonth()]} ${date.getDate()}`
}

/** 相对时间: "距今 3 天" / "今天" / "昨天" */
export function daysAgoLabel(fromDateStr: string, now: Date = new Date()): string {
  const from = new Date(fromDateStr)
  const msPerDay = 86400_000
  const startFrom = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const startNow  = new Date(now.getFullYear(),  now.getMonth(),  now.getDate())
  const diff = Math.round((startNow.getTime() - startFrom.getTime()) / msPerDay)
  if (diff <= 0) return '今天'
  if (diff === 1) return '昨天'
  return `距今 ${diff} 天`
}

/** 中文月份 "七月" */
const MONTHS_ZH = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']
export function formatMonthLabel(year: number, monthIdx: number): string {
  const nowYear = new Date().getFullYear()
  const monthName = MONTHS_ZH[monthIdx]
  return year === nowYear ? monthName : `${year}年 ${monthName}`
}

// ─── 时段 / 招呼语 ──────────────────────────────────────────

/** 时段 → 招呼语 timeContext key（跟 content greetings.getTimeContext 保持一致）*/
export function currentTimeContext(): 'morning' | 'noon' | 'afternoon' | 'evening' | 'night' {
  const h = new Date().getHours()
  if (h < 6) return 'night'
  if (h < 11) return 'morning'
  if (h < 14) return 'noon'
  if (h < 18) return 'afternoon'
  if (h < 22) return 'evening'
  return 'night'
}
