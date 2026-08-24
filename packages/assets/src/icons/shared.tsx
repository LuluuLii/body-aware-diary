import type { CSSProperties } from 'react'

export interface IconProps {
  /** Icon side length (px or CSS unit). Default 20. */
  size?: number | string
  /**
   * Stroke/fill color. **必须是具体色值 (hex / rgb / named color).**
   * 不能用 `currentColor` 或 `var(--x)`, 因为 weapp 端 icons 编译成 SVG data URL
   * 用 `<Image>` 渲染, SVG 是脱离 DOM 上下文的独立文档, 拿不到 CSS variable
   * 也无法继承 currentColor.
   */
  color?: string
  className?: string
  style?: CSSProperties
}

export const DEFAULT_ICON_SIZE = 20

/**
 * 把 SVG 字符串编码成 data URL, 供 `<Image>` 组件用.
 * 微信小程序 WXML 不认识 `<svg>` 元素, 只能通过 Image 加载 data URL.
 */
export function svgDataUrl(inner: string, opts: {
  size: number | string
  color: string
  strokeWidth?: number | string
  fill?: string
  strokeLinecap?: string
  strokeLinejoin?: string
  viewBox?: string
}): string {
  const {
    size,
    color,
    strokeWidth = 2,
    fill = 'none',
    strokeLinecap = 'round',
    strokeLinejoin = 'round',
    viewBox = '0 0 24 24',
  } = opts
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}" fill="${fill === 'STROKE' ? 'none' : (fill === 'FILL' ? color : fill)}" stroke="${fill === 'FILL' ? 'none' : color}" stroke-width="${strokeWidth}" stroke-linecap="${strokeLinecap}" stroke-linejoin="${strokeLinejoin}">${inner}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
