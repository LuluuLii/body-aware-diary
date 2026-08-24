// Weapp 端 icon shim · Image + SVG data URL.
//
// 为什么在 weapp app 里而不是 packages/assets:
//   - 微信小程序 WXML 不认 `<svg>` 元素, 必须用 `<Image>` (Taro 组件) 载 data URL
//   - packages/assets 不能引用 @tarojs/components (pnpm workspace 不 hoist Taro deps)
//   - packages/assets 保留 SVG 原版供 H5 用
//
// 副作用: SVG 从 data URL 加载, 拿不到 CSS variable / currentColor.
// 调用方必须传具体 hex 色值.
//
// 用法: `import { IconHome } from '@/lib/icons'` (weapp), API 与 @body-diary/assets 一致.

import { Image } from '@tarojs/components'
import type { CSSProperties } from 'react'
import { svgDataUrl, type IconProps } from '@body-diary/assets'

function imgStyle(size: number | string, style?: CSSProperties): CSSProperties {
  return {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    display: 'inline-block',
    verticalAlign: 'middle',
    ...style,
  }
}

// ─── Tab bar ─────────────────────────────────────────────────

export function IconHome({ size = 20, color = '#000', className, style }: IconProps) {
  const src = svgDataUrl('<path d="M4 11 12 4l8 7"/><path d="M6 9.5V20h12V9.5"/>', { size, color, strokeWidth: 1.7 })
  return <Image src={src} className={className} style={imgStyle(size, style)} />
}

export function IconReview({ size = 20, color = '#000', className, style }: IconProps) {
  const src = svgDataUrl(
    '<rect x="3" y="3" width="5" height="5" rx="1.4"/><rect x="10" y="3" width="5" height="5" rx="1.4"/><rect x="17" y="3" width="4" height="5" rx="1.4"/><rect x="3" y="10" width="5" height="5" rx="1.4"/><rect x="10" y="10" width="5" height="5" rx="1.4"/><rect x="3" y="17" width="5" height="4" rx="1.4"/>',
    { size, color, fill: 'FILL' },
  )
  return <Image src={src} className={className} style={imgStyle(size, style)} />
}

export function IconPoses({ size = 20, color = '#000', className, style }: IconProps) {
  const src = svgDataUrl(
    '<circle cx="12" cy="7" r="3.2"/><path d="M5.5 20c0-3.6 2.9-6.3 6.5-6.3S18.5 16.4 18.5 20"/>',
    { size, color, strokeWidth: 1.7 },
  )
  return <Image src={src} className={className} style={imgStyle(size, style)} />
}

export function IconDiary({ size = 20, color = '#000', className, style }: IconProps) {
  const src = svgDataUrl(
    '<path d="M6 3h11a2 2 0 0 1 2 2v16H8a2 2 0 0 1-2-2z"/><path d="M6 17h13"/>',
    { size, color, strokeWidth: 1.7 },
  )
  return <Image src={src} className={className} style={imgStyle(size, style)} />
}

export function IconPlus({ size = 28, color = '#000', className, style }: IconProps) {
  const src = svgDataUrl('<path d="M12 5v14M5 12h14"/>', { size, color, strokeWidth: 1.6 })
  return <Image src={src} className={className} style={imgStyle(size, style)} />
}

// ─── Navigation ──────────────────────────────────────────────

export function IconArrowLeft({ size = 17, color = '#000', className, style }: IconProps) {
  const src = svgDataUrl('<path d="M15 5 8 12l7 7"/>', { size, color, strokeWidth: 2.2 })
  return <Image src={src} className={className} style={imgStyle(size, style)} />
}

export function IconChevronRight({ size = 12, color = '#000', className, style }: IconProps) {
  const src = svgDataUrl('<path d="M9 5l7 7-7 7"/>', { size, color, strokeWidth: 2.2 })
  return <Image src={src} className={className} style={imgStyle(size, style)} />
}

export function IconChevronDown({ size = 12, color = '#000', className, style }: IconProps) {
  const src = svgDataUrl('<path d="M5 9l7 7 7-7"/>', { size, color, strokeWidth: 2.2 })
  return <Image src={src} className={className} style={imgStyle(size, style)} />
}

// ─── Actions ─────────────────────────────────────────────────

export function IconSearch({ size = 16, color = '#000', className, style }: IconProps) {
  const src = svgDataUrl(
    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.6-4.6"/>',
    { size, color, strokeWidth: 2 },
  )
  return <Image src={src} className={className} style={imgStyle(size, style)} />
}

export function IconEdit({ size = 14, color = '#000', className, style }: IconProps) {
  const src = svgDataUrl(
    '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    { size, color, strokeWidth: 2 },
  )
  return <Image src={src} className={className} style={imgStyle(size, style)} />
}

// ─── Feedback ────────────────────────────────────────────────

export function IconCloseBook({ size = 42, color = '#000', className, style }: IconProps) {
  const src = svgDataUrl(
    '<path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M5 4v14"/><path d="M9.5 8h5M9.5 11h5"/>',
    { size, color, strokeWidth: 1.3 },
  )
  return <Image src={src} className={className} style={imgStyle(size, style)} />
}
