// BodyFigure · 全站共享的抽象人体图组件
// - 前后视两套（front/back）
// - 4 种模式：
//     edit     — 记录页/BodyMap 覆盖层用，可点击肌肉打感受色
//     readonly — 体式详情 / 肌肉详情用，只读高亮
//     heatmap  — 回顾页用，按频率热度叠加
// - 数据源：@body-diary/assets muscleLayout（BODY_PARTS + MUSCLES_BY_VIEW）
// - 感受色：@body-diary/design-tokens sensation-* CSS 变量

import { View } from '@tarojs/components'
import type { CSSProperties } from 'react'
import {
  BODY_PARTS,
  MUSCLES_BY_VIEW,
  type BodyView,
  type MuscleLayoutEntry,
} from '@body-diary/assets'
import type { MuscleSensationTag } from '@body-diary/core'
import './index.scss'

export type BodyFigureMode = 'edit' | 'readonly' | 'heatmap'

export interface BodyFigureProps {
  view: BodyView
  mode: BodyFigureMode
  /** Muscle annotations to display (edit / readonly). Key: muscle asset id → sensation tag */
  annotations?: Record<string, MuscleSensationTag>
  /** Muscle asset ids to highlight (readonly · e.g. pose detail 主要激活肌群) */
  highlight?: readonly string[]
  /** Heat intensity per muscle 0-1 (heatmap mode) */
  heatmap?: Record<string, number>
  /** Called when a hotzone is tapped (edit mode) */
  onMusclePress?: (muscle: MuscleLayoutEntry) => void
  /** Container width in px. Height auto = size × 1.5 (matches BODY_PARTS aspect). Default 180. */
  size?: number
  className?: string
  style?: CSSProperties
}

// Map v2 sensation tags → design-tokens CSS variables
const SENSATION_COLORS: Record<MuscleSensationTag, string> = {
  soreness:  'var(--sensation-sour)',
  tightness: 'var(--sensation-tight)',
  warmth:    'var(--sensation-warm)',
  swell:     'var(--sensation-swell)',
  none:      'var(--sensation-none)',
}

export function BodyFigure({
  view,
  mode,
  annotations,
  highlight,
  heatmap,
  onMusclePress,
  size = 180,
  className,
  style,
}: BodyFigureProps) {
  const height = size * 1.5
  const muscles = MUSCLES_BY_VIEW[view]
  const highlightSet = highlight ? new Set(highlight) : undefined

  return (
    <View
      className={`body-figure ${className ?? ''}`}
      style={{ width: `${size}px`, height: `${height}px`, ...style }}
    >
      {BODY_PARTS.map((p, i) => (
        <View
          key={`part-${i}`}
          className='body-part'
          style={{
            left: p.left,
            top: p.top,
            width: p.width,
            height: p.height,
            borderRadius: p.borderRadius,
            transform: p.transform,
          }}
        />
      ))}
      {muscles.map((m) => (
        <MuscleHotzone
          key={m.id}
          muscle={m}
          mode={mode}
          annotation={annotations?.[m.id]}
          highlighted={highlightSet?.has(m.id) ?? false}
          heat={heatmap?.[m.id]}
          onPress={onMusclePress}
        />
      ))}
    </View>
  )
}

// ─── MuscleHotzone (internal) ────────────────────────────

interface MuscleHotzoneProps {
  muscle: MuscleLayoutEntry
  mode: BodyFigureMode
  annotation?: MuscleSensationTag
  highlighted: boolean
  heat?: number
  onPress?: (muscle: MuscleLayoutEntry) => void
}

function MuscleHotzone({ muscle, mode, annotation, highlighted, heat, onPress }: MuscleHotzoneProps) {
  let background = 'rgba(76, 93, 70, 0)'
  let borderColor: string = 'rgba(76, 93, 70, 0.25)'
  let showShadow = false

  if (annotation) {
    // Annotated (edit / readonly): filled sensation color
    background = SENSATION_COLORS[annotation]
    borderColor = SENSATION_COLORS[annotation]
    showShadow = true
  } else if (highlighted) {
    // Readonly highlight (pose detail): translucent green fill + solid border
    background = 'rgba(76, 93, 70, 0.42)'
    borderColor = 'var(--color-green)'
  } else if (mode === 'heatmap' && heat !== undefined && heat > 0) {
    // Heatmap: opacity scales with heat 0-1
    const clamped = Math.max(0, Math.min(1, heat))
    background = `rgba(76, 93, 70, ${(0.14 + clamped * 0.5).toFixed(3)})`
    borderColor = 'var(--color-green)'
  } else if (mode === 'edit') {
    // Edit unfilled: faint tap affordance
    background = 'rgba(76, 93, 70, 0.14)'
    borderColor = 'rgba(76, 93, 70, 0.5)'
  }

  const isClickable = mode === 'edit' && !!onPress
  const handlePress = isClickable ? () => onPress?.(muscle) : undefined

  return (
    <View
      className='muscle-hotzone'
      onClick={handlePress}
      style={{
        left: `${muscle.x}%`,
        top: `${muscle.y}%`,
        width: `${muscle.w}%`,
        height: `${muscle.h}%`,
        background,
        borderColor,
        boxShadow: showShadow ? '0 2px 6px -2px rgba(0, 0, 0, 0.3)' : 'none',
        cursor: isClickable ? 'pointer' : 'default',
      }}
    />
  )
}

// Re-export types for consumers
export type { BodyView, MuscleLayoutEntry }
