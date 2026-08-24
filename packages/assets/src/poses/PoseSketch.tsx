import type { CSSProperties } from 'react'
import { POSE_PATHS, POSE_GROUND_PATH, type PoseKind } from './paths'

export interface PoseSketchProps {
  /** Which pose sketch to render */
  kind: PoseKind
  /** Width in px. Height auto = size * 1.4 (viewBox aspect). Default 40. */
  size?: number
  /** Stroke color for the figure. Default #6B6F5B (ink-shifted). */
  stroke?: string
  /** Ground line color. Default #CDBF9E (warm accent). */
  groundColor?: string
  /** Optional stroke width override. Default 2. */
  strokeWidth?: number
  className?: string
  style?: CSSProperties
}

/**
 * Hand-drawn stick-figure pose. From handoff `poseSketch()`.
 * Renders inline SVG — works in H5. For mini program, wrap output as data URI in `<Image>`.
 */
export function PoseSketch({
  kind,
  size = 40,
  stroke = '#6B6F5B',
  groundColor = '#CDBF9E',
  strokeWidth = 2,
  className,
  style,
}: PoseSketchProps) {
  const paths = POSE_PATHS[kind] ?? POSE_PATHS.fold
  return (
    <svg
      width={size}
      height={size * 1.4}
      viewBox="0 0 100 140"
      className={className}
      style={style}
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      <path
        d={POSE_GROUND_PATH}
        fill="none"
        stroke={groundColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  )
}
