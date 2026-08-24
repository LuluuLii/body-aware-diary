// 共享的"课堂笔记 / 发力感"正文展示组件
// 用途: home whisper item · diary list card · practice-detail primary card 都用它
// 解决问题:
//   1. 每处都需要保留原文的 \n 换行（老师笔记通常按条列）
//   2. 每处都需要有 collapsed（列表节省空间）+ expanded（点开看全文）
//   3. 每处都需要"引号 + 手记" 的视觉基调
// 通过 CSS -webkit-line-clamp 做折叠，white-space: pre-line 保留换行。

import { Text } from '@tarojs/components'
import type { CSSProperties } from 'react'
import './index.scss'

export type EntryNoteVariant = 'card' | 'detail'

export interface EntryNoteTextProps {
  text: string
  /** false → 应用 CSS line-clamp 截断到 collapsedLines 行；true → 全文展示。默认 true。 */
  expanded?: boolean
  /** collapsed 时最多显示的行数。默认 3。 */
  collapsedLines?: number
  /** 双引号包裹（老师笔记的语气）。默认 true。 */
  showQuote?: boolean
  /** 'card'=13px 用于 home/diary 列表；'detail'=15px 用于详情页。默认 'card'。 */
  variant?: EntryNoteVariant
}

export function EntryNoteText({
  text,
  expanded = true,
  collapsedLines = 3,
  showQuote = true,
  variant = 'card',
}: EntryNoteTextProps) {
  const displayText = showQuote ? `"${text}"` : text
  // Line-clamp 需要 inline style（Taro 编译到小程序时 -webkit-* 需要写在 style）
  const collapseStyle: CSSProperties | undefined = !expanded
    ? ({
        display: '-webkit-box',
        WebkitLineClamp: collapsedLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      } as CSSProperties)
    : undefined
  return (
    <Text
      className={`entry-note entry-note-${variant} ${expanded ? 'is-expanded' : 'is-collapsed'}`}
      style={collapseStyle}
    >
      {displayText}
    </Text>
  )
}
