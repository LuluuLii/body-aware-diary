// @body-diary/assets · icons (H5 / cross-platform SVG)
//
// SVG icons for browsers / H5. Weapp uses its own Image-based icon shim at
// apps/weapp/src/lib/icons.tsx (WXML doesn't render <svg> elements).
//
// Each icon takes `size` (default 20) and `color` (default currentColor).
// viewBox 统一 0 0 24 24 unless noted.

import { DEFAULT_ICON_SIZE, type IconProps } from './shared'

export type { IconProps } from './shared'
export { DEFAULT_ICON_SIZE, svgDataUrl } from './shared'

// ─── Tab bar ─────────────────────────────────────────────────

export function IconHome({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 9.5V20h12V9.5" />
    </svg>
  )
}

export function IconReview({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} style={style}>
      <rect x="3"  y="3"  width="5" height="5" rx="1.4" />
      <rect x="10" y="3"  width="5" height="5" rx="1.4" />
      <rect x="17" y="3"  width="4" height="5" rx="1.4" />
      <rect x="3"  y="10" width="5" height="5" rx="1.4" />
      <rect x="10" y="10" width="5" height="5" rx="1.4" />
      <rect x="3"  y="17" width="5" height="4" rx="1.4" />
    </svg>
  )
}

export function IconPoses({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <circle cx="12" cy="7" r="3.2" />
      <path d="M5.5 20c0-3.6 2.9-6.3 6.5-6.3S18.5 16.4 18.5 20" />
    </svg>
  )
}

export function IconDiary({ size = DEFAULT_ICON_SIZE, color = 'currentColor', className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.7" strokeLinejoin="round" className={className} style={style}>
      <path d="M6 3h11a2 2 0 0 1 2 2v16H8a2 2 0 0 1-2-2z" />
      <path d="M6 17h13" />
    </svg>
  )
}

export function IconPlus({ size = 28, color = 'currentColor', className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.6" strokeLinecap="round" className={className} style={style}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

// ─── Navigation ──────────────────────────────────────────────

export function IconArrowLeft({ size = 17, color = 'currentColor', className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  )
}

export function IconChevronRight({ size = 12, color = 'currentColor', className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function IconChevronDown({ size = 12, color = 'currentColor', className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M5 9l7 7 7-7" />
    </svg>
  )
}

// ─── Actions ─────────────────────────────────────────────────

export function IconSearch({ size = 16, color = 'currentColor', className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2" className={className} style={style}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.6-4.6" />
    </svg>
  )
}

export function IconEdit({ size = 14, color = 'currentColor', className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  )
}

// ─── Feedback ────────────────────────────────────────────────

export function IconCloseBook({ size = 42, color = 'currentColor', className, style }: IconProps) {
  // Used by 「记下了」 submit animation. Larger default size.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.3" strokeLinejoin="round" className={className} style={style}>
      <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" />
      <path d="M5 4v14" />
      <path d="M9.5 8h5M9.5 11h5" />
    </svg>
  )
}
