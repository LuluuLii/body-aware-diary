// Sensation vocabulary:
//   1. Muscle-level tags (酸/紧/温/涨/无感) — used on BodyMap muscle click sheet
//   2. Quadrant words (SensationPicker 2×2) — used on record page全整体感受
// Colors for these live in @body-diary/design-tokens (sensationColors / quadrantColors).

// ─── 1. Muscle-level sensation tags ──────────────────────────

export const MUSCLE_SENSATION_TAGS = [
  { key: 'sour',  label: '酸' },
  { key: 'tight', label: '紧' },
  { key: 'warm',  label: '温' },
  { key: 'swell', label: '涨' },
  { key: 'none',  label: '无感' },
] as const

export type MuscleSensationKey = typeof MUSCLE_SENSATION_TAGS[number]['key']

// ─── 2. SensationPicker 2×2 quadrant ─────────────────────────

/** Quadrant ids. Positions on the 消耗 ↔ 滋养 × 训练感浅 ↔ 训练感深 axis:
 *   over (左上): 消耗 + 训练感深
 *   full (右上): 滋养 + 训练感深
 *   un   (左下): 消耗 + 训练感浅
 *   ease (右下): 滋养 + 训练感浅
 */
export type Quadrant = 'over' | 'full' | 'un' | 'ease'

export const QUADRANT_LABELS: Record<Quadrant, string> = {
  over: '过载',
  full: '饱满',
  un:   '未启',
  ease: '舒展',
}

/** Precise sensation words per quadrant. Chips appear when user drops the coord point. */
export const QUADRANT_WORDS: Record<Quadrant, readonly string[]> = {
  ease: ['放松', '舒展', '通透', '宁静', '轻盈', '微', '恢复', '松开'],
  full: ['充实', '饱满', '清晰', '激活', '突破', '通电', '酸爽', '有力'],
  over: ['累', '酸', '紧', '抽', '颤', '闷', '代偿', '勉强'],
  un:   ['无感', '空', '麻木', '拖沓', '走神', '浮', '隔', '干'],
}

// ─── Helpers ────────────────────────────────────────────────

/**
 * Map an (x, y) coordinate on [-1, 1] to the nearest quadrant.
 * Used by SensationPicker to switch candidate chips as user drags the point.
 *
 * Convention (matches design-tokens quadrant layout):
 *   x: 消耗(-) ↔ 滋养(+)
 *   y: 训练感浅(-) ↔ 训练感深(+)
 */
export function nearestQuadrant(coord: { x: number; y: number }): Quadrant {
  const { x, y } = coord
  if (x >= 0 && y >= 0) return 'full'   // 滋养 + 训练感深
  if (x >= 0 && y < 0)  return 'ease'   // 滋养 + 训练感浅
  if (x < 0  && y >= 0) return 'over'   // 消耗 + 训练感深
  return 'un'                            // 消耗 + 训练感浅
}
