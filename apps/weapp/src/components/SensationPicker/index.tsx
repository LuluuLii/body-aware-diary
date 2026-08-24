// SensationPicker · 2×2 坐标象限 + 候选词胶囊（含 ＋ 自定义）
// 用途：record 页的"整节课整体感受"选择器。
//
// 交互模型（PRD § 4.2）：
//   - 用户在 180×180 坐标平面上 tap/drag 放一个点
//   - X 轴: 消耗 ↔ 滋养 · Y 轴: 训练感浅 ↔ 深
//   - 四象限颜色 = 视觉锚点（over / full / un / ease），不是选择目标
//   - 点落下后下方出现候选词胶囊（跟着最近象限动态切换）
//   - 胶囊行末尾有 ＋ 胶囊 → 点开展开内联输入 → 回车/失焦确认加词
//   - 词库 max 3 词（选满就不显示 ＋ 也不能再选新的）

import { useEffect, useRef, useState, useMemo, type CSSProperties } from 'react'
import { View, Text, Input } from '@tarojs/components'
import { nearestQuadrant, QUADRANT_WORDS, QUADRANT_LABELS } from '@body-diary/content'
import type { SensationCoord } from '@body-diary/core'
import './index.scss'

const CANVAS_PX = 180
const MAX_WORDS = 3

export interface SensationValue {
  coord: SensationCoord | null
  /** Selected chips (candidate words + user-typed customs, merged into one list) */
  words: string[]
}

export interface SensationPickerProps {
  value: SensationValue
  onChange: (next: SensationValue) => void
  /**
   * "bare" 模式去掉外层 .sensation-picker 卡片装饰（背景/边框/padding）,
   * 让父容器可以把它跟其他内容合并到同一张卡里，避免多个卡片视觉拥挤。
   */
  bare?: boolean
}

export function SensationPicker({ value, onChange, bare }: SensationPickerProps) {
  const canvasRef = useRef<any>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  // Reset editing state when word list changes externally
  useEffect(() => {
    if (value.words.length >= MAX_WORDS) setEditing(false)
  }, [value.words.length])

  const setCoordFromClient = (clientX: number, clientY: number) => {
    const el = canvasRef.current
    if (!el || typeof el.getBoundingClientRect !== 'function') return
    const rect = el.getBoundingClientRect()
    if (!rect || !rect.width || !rect.height) return
    let x = ((clientX - rect.left) / rect.width) * 2 - 1
    let y = (1 - (clientY - rect.top) / rect.height) * 2 - 1
    x = Math.max(-1, Math.min(1, x))
    y = Math.max(-1, Math.min(1, y))
    onChange({ ...value, coord: { x, y } })
  }

  // 用 any 兼容 Taro CommonEventFunction 签名（H5/weapp 事件对象结构不同）
  const handleTouch = (e: any) => {
    const touches = e?.touches?.length ? e.touches : e?.changedTouches
    const t = touches?.[0]
    if (!t) return
    // H5 原生 TouchEvent 有 clientX/Y；小程序 touch 对象只有 pageX/Y
    const x = t.clientX ?? t.pageX ?? 0
    const y = t.clientY ?? t.pageY ?? 0
    setCoordFromClient(x, y)
  }

  const handleMouseDown = (e: any) => {
    if (typeof e?.clientX !== 'number') return
    setCoordFromClient(e.clientX, e.clientY)
  }

  const currentQuadrant = value.coord ? nearestQuadrant(value.coord) : null
  const chipWords = useMemo(() => {
    if (!currentQuadrant) return []
    return QUADRANT_WORDS[currentQuadrant] as readonly string[]
  }, [currentQuadrant])

  const toggleWord = (w: string) => {
    if (value.words.includes(w)) {
      onChange({ ...value, words: value.words.filter((x) => x !== w) })
      return
    }
    if (value.words.length >= MAX_WORDS) return
    onChange({ ...value, words: [...value.words, w] })
  }

  const openEditor = () => {
    if (value.words.length >= MAX_WORDS) return
    setDraft('')
    setEditing(true)
  }

  const commitDraft = () => {
    const w = draft.trim()
    setEditing(false)
    setDraft('')
    if (!w) return
    if (value.words.includes(w)) return
    if (value.words.length >= MAX_WORDS) return
    onChange({ ...value, words: [...value.words, w] })
  }

  const cancelDraft = () => {
    setEditing(false)
    setDraft('')
  }

  const pointStyle: CSSProperties = value.coord
    ? {
        left: `${((value.coord.x + 1) / 2) * CANVAS_PX}px`,
        top:  `${(1 - (value.coord.y + 1) / 2) * CANVAS_PX}px`,
      }
    : { display: 'none' }

  const canAddMore = value.words.length < MAX_WORDS

  return (
    <View className={bare ? 'sensation-picker sensation-picker-bare' : 'sensation-picker'}>
      <View className='meta-label'>这一节课，整体的感受</View>
      <View className='canvas-wrap'>
        {/* H5 需要 onMouseDown 支持桌面浏览器；weapp 里没有此 prop 但 Taro 编译时会忽略 */}
        {(() => {
          const extraProps: any = process.env.TARO_ENV === 'h5' ? { onMouseDown: handleMouseDown } : {}
          return (
            <View
              className='canvas'
              ref={canvasRef}
              onTouchStart={handleTouch}
              onTouchMove={handleTouch}
              style={{ width: `${CANVAS_PX}px`, height: `${CANVAS_PX}px` }}
              {...extraProps}
            >
          {/* Quadrant background tiles */}
          <View className='q q-over' />
          <View className='q q-full' />
          <View className='q q-un' />
          <View className='q q-ease' />
          {/* Center cross */}
          <View className='axis-vx' />
          <View className='axis-hx' />
          {/* Quadrant name anchors */}
          <Text className='qname qname-over'>过载</Text>
          <Text className='qname qname-full'>饱满</Text>
          <Text className='qname qname-un'>未启</Text>
          <Text className='qname qname-ease'>舒展</Text>
          {/* Axis edge labels */}
          <Text className='axis-label axis-top'>训练感深</Text>
          <Text className='axis-label axis-bottom'>训练感浅</Text>
          <Text className='axis-label axis-left'>消耗</Text>
          <Text className='axis-label axis-right'>滋养</Text>
          {/* Placed point */}
          <View className='dot' style={pointStyle} />
          {/* Empty hint */}
          {!value.coord && <Text className='empty-hint'>在这里放一个点</Text>}
            </View>
          )
        })()}
      </View>

      {value.coord && (
        <>
          <View className='near-hint'>
            你的位置偏向 <Text className='near-name'>{QUADRANT_LABELS[currentQuadrant!]}</Text>
          </View>
          <View className='chip-row'>
            {/* Candidate chips from nearest quadrant */}
            {chipWords.map((w) => {
              const active = value.words.includes(w)
              const style: CSSProperties = active
                ? {
                    background: 'var(--color-green)',
                    color: 'var(--color-green-text)',
                    borderColor: 'var(--color-green)',
                  }
                : {}
              return (
                <Text
                  key={w}
                  className={`chip ${active ? 'active' : ''}`}
                  style={style}
                  onClick={() => toggleWord(w)}
                >
                  {w}
                </Text>
              )
            })}
            {/* Custom-typed words already committed (shown even if not in candidate set) */}
            {value.words
              .filter((w) => !chipWords.includes(w))
              .map((w) => (
                <Text
                  key={`custom-${w}`}
                  className='chip active custom'
                  style={{
                    background: 'var(--color-green)',
                    color: 'var(--color-green-text)',
                    borderColor: 'var(--color-green)',
                  }}
                  onClick={() => toggleWord(w)}
                >
                  {w}
                </Text>
              ))}
            {/* ＋ capsule → inline input */}
            {canAddMore && !editing && (
              <Text className='chip chip-plus' onClick={openEditor}>＋</Text>
            )}
            {editing && (
              <View className='chip chip-editing'>
                <Input
                  className='chip-input'
                  value={draft}
                  placeholder='自己的话'
                  focus
                  confirmType='done'
                  onInput={(e: any) => setDraft(e?.detail?.value ?? '')}
                  onConfirm={commitDraft}
                  onBlur={commitDraft}
                  maxlength={12}
                />
                <Text className='chip-cancel' onClick={cancelDraft}>×</Text>
              </View>
            )}
          </View>
          <View className='meta-count'>
            {value.words.length} / {MAX_WORDS} 个感受词
          </View>
        </>
      )}
    </View>
  )
}
