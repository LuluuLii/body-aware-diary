// YearColorGrid · 年度身体色卡（W 列 × 7 行网格）
// 每格一天，按当天 entries 的 sensation_coord.y 平均值着色：
//   y > 0 (滋养) → 绿色渐变（越大越深）
//   y < 0 (消耗) → 暖色渐变（越负越深）
//   无 entries → 空色
//
// 组件自带 horizontal scroll 容器 + 挂载时自动滚到最右（今天可见），
// 长版本（53 周）可用手指/触控板向左拖看过去。
// 底部一行月份标签跟随滚动，让日期可见。

import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { DiaryEntry } from '@body-diary/core'
import './index.scss'

// 唯一 id 前缀 · 让 <ScrollView scroll-into-view> 定位到"今天"列
let __ycgUidCounter = 0
function useYcgUid() {
  const [uid] = useState(() => `ycg-${++__ycgUidCounter}`)
  return uid
}

// 跨平台读取节点宽度 · H5 用 clientWidth，weapp 用 SelectorQuery
async function measureWidth(selector: string): Promise<number> {
  return new Promise((resolve) => {
    const query = Taro.createSelectorQuery()
    query.select(selector).boundingClientRect()
    query.exec((res: any[]) => {
      const rect = res?.[0]
      resolve(rect?.width ?? 0)
    })
  })
}

export interface YearColorGridProps {
  entries: readonly DiaryEntry[]
  /** 显示多少列（周数）。首页缩略 24；回顾页 53（全年） */
  weeks?: number
  /** 每格边长 px（fillWidth 模式下作为最小值使用） */
  cellSize?: number
  /** 格间距 px */
  gap?: number
  /** 反色（深色卡片上用亮色边） */
  onDark?: boolean
  /** 点击某格回调（date ISO 字符串） */
  onCellPress?: (dateIso: string) => void
  /**
   * 是否按容器宽度自动扩满 · 只在 weeks 少（首页 24 周）时启用；
   * 回顾页 53 周不用（本身超屏，应该 scroll）。
   */
  fillWidth?: boolean
}

// 正向绿色渐变（从浅到深）
const POS_GRAD = ['#EAE3D2', '#CBD4B0', '#A9BA88', '#7C935E', '#4C5D44']
// 负向暖色渐变（消耗）
const NEG_GRAD = ['#EAE3D2', '#E4C6B4', '#D6AC97', '#C9987F', '#BE8A70']
const EMPTY = '#EAE3D2'
const EMPTY_ON_DARK = 'rgba(255,255,255,0.06)'

interface CellData {
  iso: string   // YYYY-MM-DD
  value: number // -1..1, or 0 for empty
  isEmpty: boolean
}

/** 从 entries 计算每天的色卡值 */
function computeCells(entries: readonly DiaryEntry[], weeks: number): CellData[] {
  const cells: CellData[] = []
  const now = new Date()
  const totalDays = weeks * 7
  // 从 (今天 - totalDays + 1) 到今天
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const iso = toIso(d)
    cells.push({ iso, value: 0, isEmpty: true })
  }
  // 聚合 entries 按日
  const byDay = new Map<string, { sum: number; count: number }>()
  for (const e of entries) {
    if (!e.created_at) continue
    const iso = toIso(new Date(e.created_at))
    const y = e.sensation_coord?.y ?? 0
    const cur = byDay.get(iso)
    if (cur) { cur.sum += y; cur.count += 1 }
    else byDay.set(iso, { sum: y, count: 1 })
  }
  // 涂色
  for (const cell of cells) {
    const agg = byDay.get(cell.iso)
    if (agg && agg.count > 0) {
      cell.value = agg.sum / agg.count
      cell.isEmpty = false
    }
  }
  return cells
}

function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 从 cells 派生每一列（周）应该显示什么月份标签 · 只在月份切换的第一周显示 */
interface MonthLabel {
  col: number       // 从 0 开始的列 index
  label: string     // "5 月"
}
function computeMonthLabels(cells: CellData[]): MonthLabel[] {
  const labels: MonthLabel[] = []
  let lastMonth = -1
  const totalCols = Math.ceil(cells.length / 7)
  for (let col = 0; col < totalCols; col++) {
    // 用该列的第一格（周一位置）判断月份
    const firstCell = cells[col * 7]
    if (!firstCell) continue
    const month = new Date(firstCell.iso).getMonth() // 0-11
    if (month !== lastMonth) {
      labels.push({ col, label: `${month + 1} 月` })
      lastMonth = month
    }
  }
  return labels
}

function cellColor(cell: CellData, onDark: boolean): string {
  if (cell.isEmpty) return onDark ? EMPTY_ON_DARK : EMPTY
  const abs = Math.min(1, Math.abs(cell.value))
  const idx = Math.min(4, Math.floor(abs * 5))
  const grad = cell.value >= 0 ? POS_GRAD : NEG_GRAD
  return grad[idx]
}

// ─── Legend ──────────────────────────────────────────────
// 首页/回顾页身体色卡的图例：滋养→充分 渐变 + 过载/消耗 单点
// 视觉直接映射 POS_GRAD / NEG_GRAD 端点，跟格子颜色一致。

export interface YearColorGridLegendProps {
  /** 深色背景（首页/回顾页深绿卡）用亮色文字 */
  onDark?: boolean
}

export function YearColorGridLegend({ onDark = false }: YearColorGridLegendProps) {
  const textColor = onDark ? 'var(--color-green-text-sub)' : 'var(--color-text-tag)'
  // 用 POS_GRAD 首尾做 linear-gradient 得到平滑绿渐变
  const posGradient = `linear-gradient(90deg, ${POS_GRAD[0]} 0%, ${POS_GRAD[2]} 50%, ${POS_GRAD[4]} 100%)`
  const negColor = NEG_GRAD[3]  // 中偏深的暖色，代表消耗
  return (
    <View className='ycg-legend'>
      <View className='ycg-legend-group'>
        <Text className='ycg-legend-label' style={{ color: textColor }}>滋养</Text>
        <View
          className='ycg-legend-bar'
          style={{ background: posGradient }}
        />
        <Text className='ycg-legend-label' style={{ color: textColor }}>充分</Text>
      </View>
      <View className='ycg-legend-group'>
        <View className='ycg-legend-dot' style={{ background: negColor }} />
        <Text className='ycg-legend-label' style={{ color: textColor }}>过载 / 消耗</Text>
      </View>
    </View>
  )
}

// ─── Grid ────────────────────────────────────────────────

export function YearColorGrid({
  entries,
  weeks = 24,
  cellSize: propCellSize = 7,
  gap = 2,
  onDark = false,
  onCellPress,
  fillWidth = false,
}: YearColorGridProps) {
  const uid = useYcgUid()
  const cells = computeCells(entries, weeks)
  const monthLabels = computeMonthLabels(cells)
  const [effectiveCellSize, setEffectiveCellSize] = useState<number>(propCellSize)
  // scrollIntoView 目标 · 设成"最后一列"实现"自动滚到今天"
  const [scrollIntoViewId, setScrollIntoViewId] = useState<string>('')

  // fillWidth 模式：跨平台测量容器宽度，按 weeks 算 cell size 让 grid 填满
  useEffect(() => {
    if (!fillWidth) {
      setEffectiveCellSize(propCellSize)
      return
    }
    const t = setTimeout(async () => {
      const w = await measureWidth(`#${uid}`)
      if (w > 0) {
        const cs = Math.floor((w - (weeks - 1) * gap) / weeks)
        if (cs > 0) setEffectiveCellSize(cs)
      }
    }, 30)
    return () => clearTimeout(t)
  }, [fillWidth, propCellSize, weeks, gap, uid])

  const cellSize = effectiveCellSize

  // Mount 后触发 scroll-into-view 到最后一列
  // 用 <ScrollView scrollIntoView> 跨平台生效
  useEffect(() => {
    const t = setTimeout(() => {
      setScrollIntoViewId(`${uid}-end`)
    }, 100)
    return () => clearTimeout(t)
  }, [weeks, cellSize, fillWidth, uid])

  const colWidth = cellSize + gap
  const totalCols = Math.ceil(cells.length / 7)
  const totalWidth = totalCols * colWidth - gap

  const monthLabelColor = onDark ? 'var(--color-green-text-sub)' : 'var(--color-text-tag)'

  return (
    <ScrollView
      id={uid}
      className='year-color-grid-scroll'
      scrollX
      scrollWithAnimation={false}
      scrollIntoView={scrollIntoViewId}
      enhanced
      showScrollbar={false}
    >
      <View className='year-color-grid-inner' style={{ width: `${totalWidth}px` }}>
        {/* Grid 主体 · 7 行 × N 列，column-major */}
        <View
          className='year-color-grid'
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(7, ${cellSize}px)`,
            gridAutoFlow: 'column',
            gridAutoColumns: `${cellSize}px`,
            gap: `${gap}px`,
            justifyContent: 'start',
          }}
        >
          {cells.map((c, i) => {
            // 最后一列的第一格挂 id 供 scrollIntoView 定位到"今天"所在列
            const isEndAnchor = i === cells.length - 7
            return (
              <View
                key={c.iso}
                id={isEndAnchor ? `${uid}-end` : undefined}
                className='year-cell'
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  borderRadius: '2px',
                  background: cellColor(c, onDark),
                  cursor: onCellPress ? 'pointer' : 'default',
                }}
                onClick={onCellPress ? () => onCellPress(c.iso) : undefined}
              />
            )
          })}
        </View>

        {/* 月份标签行 · 跟着 grid 滚动 */}
        <View className='year-month-labels' style={{ width: `${totalWidth}px` }}>
          {monthLabels.map((m) => (
            <Text
              key={`${m.col}-${m.label}`}
              className='year-month-label'
              style={{
                left: `${m.col * colWidth}px`,
                color: monthLabelColor,
              }}
            >{m.label}</Text>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}
