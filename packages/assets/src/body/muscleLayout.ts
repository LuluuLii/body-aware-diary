// @body-diary/assets · body figure & muscle layout data
// Percentage-based hotzone positions on the abstract CSS-block body figure.
// Extracted from handoff `FRONT_MUSCLES` / `BACK_MUSCLES` (身心训练记录 App.dc.html:510-539).
//
// Coordinates are % of the parent container's bounding box.
// Consumer (BodyFigure component in apps/weapp T8) renders each hotzone as an
// absolutely-positioned box on top of the body-figure background.

export type BodyView = 'front' | 'back'

export interface MuscleLayoutEntry {
  /** Stable id, shared with @body-diary/content muscle metadata */
  id: string
  /** Chinese short name (redundant with content but useful for standalone rendering) */
  name: string
  /** Body region label (for tooltip / sheet header) */
  region: string
  /** Left position, % of container width */
  x: number
  /** Top position, % of container height */
  y: number
  /** Width, % of container width */
  w: number
  /** Height, % of container height */
  h: number
}

export const FRONT_MUSCLES: readonly MuscleLayoutEntry[] = [
  { id: 'delt_l',  name: '三角肌',   region: '左肩',   x: 20, y: 20, w: 15, h: 9 },
  { id: 'delt_r',  name: '三角肌',   region: '右肩',   x: 65, y: 20, w: 15, h: 9 },
  { id: 'pec',     name: '胸大肌',   region: '胸',     x: 35, y: 23, w: 30, h: 11 },
  { id: 'bi_l',    name: '肱二头肌', region: '左臂',   x: 14, y: 33, w: 11, h: 12 },
  { id: 'bi_r',    name: '肱二头肌', region: '右臂',   x: 75, y: 33, w: 11, h: 12 },
  { id: 'rectus',  name: '腹直肌',   region: '核心',   x: 38, y: 37, w: 24, h: 15 },
  { id: 'obl_l',   name: '腹外斜肌', region: '左腰',   x: 30, y: 39, w: 8,  h: 12 },
  { id: 'obl_r',   name: '腹外斜肌', region: '右腰',   x: 62, y: 39, w: 8,  h: 12 },
  { id: 'hip_l',   name: '髂腰肌',   region: '左髋',   x: 34, y: 53, w: 12, h: 9 },
  { id: 'hip_r',   name: '髂腰肌',   region: '右髋',   x: 54, y: 53, w: 12, h: 9 },
  { id: 'quad_l',  name: '股四头肌', region: '左大腿', x: 33, y: 63, w: 14, h: 17 },
  { id: 'quad_r',  name: '股四头肌', region: '右大腿', x: 53, y: 63, w: 14, h: 17 },
  { id: 'shin_l',  name: '胫骨前肌', region: '左小腿', x: 35, y: 83, w: 11, h: 13 },
  { id: 'shin_r',  name: '胫骨前肌', region: '右小腿', x: 54, y: 83, w: 11, h: 13 },
] as const

export const BACK_MUSCLES: readonly MuscleLayoutEntry[] = [
  { id: 'trap',    name: '斜方肌',     region: '上背',     x: 36, y: 19, w: 28, h: 11 },
  { id: 'delt_bl', name: '三角肌后束', region: '左肩',     x: 20, y: 21, w: 14, h: 9 },
  { id: 'delt_br', name: '三角肌后束', region: '右肩',     x: 66, y: 21, w: 14, h: 9 },
  { id: 'lat_l',   name: '背阔肌',     region: '左背',     x: 30, y: 32, w: 14, h: 14 },
  { id: 'lat_r',   name: '背阔肌',     region: '右背',     x: 56, y: 32, w: 14, h: 14 },
  { id: 'erector', name: '竖脊肌',     region: '下背',     x: 44, y: 33, w: 12, h: 16 },
  { id: 'glute_l', name: '臀大肌',     region: '左臀',     x: 33, y: 52, w: 16, h: 12 },
  { id: 'glute_r', name: '臀大肌',     region: '右臀',     x: 51, y: 52, w: 16, h: 12 },
  { id: 'ham_l',   name: '腘绳肌',     region: '左大腿后', x: 34, y: 65, w: 13, h: 16 },
  { id: 'ham_r',   name: '腘绳肌',     region: '右大腿后', x: 53, y: 65, w: 13, h: 16 },
  { id: 'calf_l',  name: '腓肠肌',     region: '左小腿',   x: 35, y: 83, w: 11, h: 13 },
  { id: 'calf_r',  name: '腓肠肌',     region: '右小腿',   x: 54, y: 83, w: 11, h: 13 },
] as const

export const MUSCLES_BY_VIEW: Record<BodyView, readonly MuscleLayoutEntry[]> = {
  front: FRONT_MUSCLES,
  back: BACK_MUSCLES,
}

// ─── Abstract body-figure part layout ─────────────────────────
// Head / torso / arms / legs — positions to render the CSS-block body figure.
// Applied as absolute positioning inside a container of size W × (W * 1.5).

export interface BodyPartLayout {
  left: string
  top: string
  width: string
  height: string
  borderRadius: string
  /** Optional rotation, e.g. 'rotate(6deg)' */
  transform?: string
}

export const BODY_PARTS: readonly BodyPartLayout[] = [
  { left: '40%', top:  '0%', width: '20%', height: '10%', borderRadius: '50%' },                                 // head
  { left: '30%', top: '11%', width: '40%', height: '34%', borderRadius: '40% 40% 26% 26%' },                     // torso
  { left: '12%', top: '15%', width: '16%', height: '30%', borderRadius: '20px', transform: 'rotate(6deg)' },     // left arm
  { left: '72%', top: '15%', width: '16%', height: '30%', borderRadius: '20px', transform: 'rotate(-6deg)' },    // right arm
  { left: '31%', top: '46%', width: '18%', height: '52%', borderRadius: '16px 16px 20px 20px' },                 // left leg
  { left: '51%', top: '46%', width: '18%', height: '52%', borderRadius: '16px 16px 20px 20px' },                 // right leg
] as const

/**
 * Look up a muscle layout entry by id + view.
 * Consumer typically iterates MUSCLES_BY_VIEW[view] directly; this is for spot lookups.
 */
export function findMuscle(id: string, view: BodyView): MuscleLayoutEntry | undefined {
  return MUSCLES_BY_VIEW[view].find((m) => m.id === id)
}
