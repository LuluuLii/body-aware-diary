// Sprint 2 · 首页 handoff 还原
// - 拉丁小标 (Caveat)
// - Serif 招呼语 + 副句（按时段挑）
// - 上一次练习卡（暖白）
// - 年度身体色卡缩略卡（深绿）
// - 身体絮语卡（近 3 条记录）

import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import {
  ensureProfile,
  getLatestPractice,
  listEntries,
  type DiaryEntry,
  type PracticeSession,
} from '@body-diary/core'
import {
  GREETINGS,
  getPoseById,
  type Greeting,
} from '@body-diary/content'
import { poseName } from '../../lib/poses'
import { PoseSketch, type PoseKind } from '@body-diary/assets'
import { getSupabase, ensureAnonymousSession } from '../../lib/supabase'
import {
  formatLatinHeader,
  formatShortDate,
  daysAgoLabel,
  ACTIVITY_TYPE_LABELS,
  currentTimeContext,
} from '../../lib/format'
import { TabBar } from '../../components/TabBar'
import { YearColorGrid, YearColorGridLegend } from '../../components/YearColorGrid'
import { EntryNoteText } from '../../components/EntryNoteText'
import './index.scss'

function pickGreetingByContext(): Greeting {
  const ctx = currentTimeContext()
  const candidates = GREETINGS.filter((g) => g.timeContext === ctx || g.timeContext === 'any')
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function poseKindFor(entry: DiaryEntry): PoseKind {
  // v2.7-A: 取第一个 pose_id 用作简笔画选择
  // v2.7-B: user_pose 没有 sketchKind，fallback 'seated'
  const first = entry.pose_ids?.[0]
  if (first) {
    const builtin = getPoseById(first)
    if (builtin) return builtin.sketchKind
  }
  return 'seated'
}

function whisperMeta(entry: DiaryEntry): string {
  const date = formatShortDate(entry.created_at)
  const activity = ACTIVITY_TYPE_LABELS[entry.activity_type] ?? '记录'
  return `${date} · ${activity}`
}

/** 拿到用户真正手写的正文（活动笔记 / 内容）；否则返回 null 走 fallback。 */
function entryNoteBody(entry: DiaryEntry): string | null {
  const a = entry.activation_note?.trim()
  if (a) return a
  const c = entry.content?.trim()
  if (c) return c
  return null
}

/** 无正文时用感受词或占位。列表用。 */
function entryFallbackText(entry: DiaryEntry): string {
  if (entry.sensation_words && entry.sensation_words.length) {
    return `留下感受: ${entry.sensation_words.join(' · ')}`
  }
  const cnt = Object.keys(entry.sensation_coord ?? {}).length
  return cnt > 0 ? '一次感受的留痕' : '这一次留下了什么'
}

/** 用第一条感受词或第一个 annotation 决定 dot 色。缺省用绿。 */
function whisperDotColor(entry: DiaryEntry): string {
  // For MVP: derive from sensation_coord.y - 消耗则暖橙, 滋养则绿
  const y = entry.sensation_coord?.y
  if (y !== null && y !== undefined) {
    if (y >= 0) return 'var(--sensation-swell)'  // 涨/滋养 → 绿
    return 'var(--sensation-tight)'                // 消耗 → 棕
  }
  return 'var(--sensation-none)'
}

export default function Home() {
  const [greeting] = useState<Greeting>(() => pickGreetingByContext())
  const [lastPractice, setLastPractice] = useState<PracticeSession | null>(null)
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  // 每条 whisper 独立 expand 状态。点卡片 = toggle。
  const [expandedWhispers, setExpandedWhispers] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const session = await ensureAnonymousSession()
        if (!session || cancelled) return
        const client = getSupabase()
        await ensureProfile(client, session.user.id)
        const [latestPractice, recent] = await Promise.all([
          getLatestPractice(client, session.user.id),
          listEntries(client, session.user.id, { limit: 100 }),
        ])
        if (cancelled) return
        setLastPractice(latestPractice)
        setEntries(recent)
        setTotalCount(recent.length)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[home] load failed', err)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const goRecord = () => Taro.reLaunch({ url: '/pages/record/index' })
  const goReview = () => Taro.reLaunch({ url: '/pages/review/index' })
  const goDiary = () => Taro.reLaunch({ url: '/pages/diary/index' })
  const goPracticeDetail = (id: string) => Taro.navigateTo({ url: `/pages/practice-detail/index?id=${id}` })

  const recentWhispers = entries.slice(0, 3)

  return (
    <View className='home-page paper-grid-bg'>
      {/* 拉丁小标 + 招呼语 + 副句 */}
      <Text className='latin-header'>{formatLatinHeader()}</Text>
      <Text className='greeting-title'>{greeting.title}</Text>
      <Text className='greeting-sub'>{greeting.subtitle}</Text>

      {/* 上一次练习卡 → practice-detail */}
      {lastPractice ? (() => {
        // 找该 practice 的首条记录（用于展示感受词）
        const primaryEntry = entries.find((e) => e.practice_session_id === lastPractice.id)
        const dotColor = primaryEntry ? whisperDotColor(primaryEntry) : 'var(--sensation-none)'
        const words = primaryEntry?.sensation_words ?? []
        return (
          <View className='last-card' onClick={() => goPracticeDetail(lastPractice.id)}>
            <View className='last-card-head'>
              <Text className='last-card-label'>
                上一次练习 · 第 {lastPractice.practice_number} 次
                <Text className='last-card-days-ago'> · {daysAgoLabel(lastPractice.practiced_at)}</Text>
              </Text>
              <Text className='last-card-date'>Date · {formatShortDate(lastPractice.practiced_at)}</Text>
            </View>
            <Text className='last-card-title'>
              {ACTIVITY_TYPE_LABELS[lastPractice.activity_type] ?? '记录'}
              {(() => {
                const names = [
                  ...lastPractice.pose_ids.map((id) => poseName(id)).filter(Boolean) as string[],
                  ...lastPractice.custom_pose_names,
                ]
                if (names.length === 0) return ''
                const shown = names.slice(0, 2).join(' · ')
                const suffix = names.length > 2 ? ` · +${names.length - 2}` : ''
                return ` · ${shown}${suffix}`
              })()}
            </Text>
            {words.length > 0 && (
              <View className='last-card-tags'>
                {words.slice(0, 3).map((w, i) => (
                  <Text key={`w-${i}`} className='last-tag'>
                    <View className='last-tag-dot' style={{ background: dotColor }} />
                    {w}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )
      })() : (
        <View className='last-card empty' onClick={goRecord}>
          <Text className='last-card-label'>还没开始</Text>
          <Text className='last-card-empty'>点下方 ＋，留下今天的第一次。</Text>
        </View>
      )}

      {/* 年度身体色卡缩略卡（深绿） */}
      <View className='year-card' onClick={goReview}>
        <View className='year-card-head'>
          <Text className='year-card-title'>
            你的身体，这一年
            <Text className='year-card-count-inline'> · 已记下 {totalCount} 次</Text>
          </Text>
          <Text className='year-card-caret'>›</Text>
        </View>
        <View className='year-card-grid-wrap'>
          <YearColorGrid entries={entries} weeks={24} cellSize={7} gap={2} onDark fillWidth />
        </View>
        <View className='year-card-legend-slot'>
          <YearColorGridLegend onDark />
        </View>
      </View>

      {/* 身体絮语卡（近 3 条） */}
      <View className='whisper-card'>
        <View className='whisper-head'>
          <Text className='whisper-title'>身体絮语</Text>
          <Text className='whisper-more' onClick={goDiary}>翻旧页 ›</Text>
        </View>
        <Text className='whisper-sub'>你留给自己的话，随手翻翻</Text>
        {recentWhispers.length === 0 && (
          <Text className='whisper-empty'>还没有留下过什么。点 ＋ 开始。</Text>
        )}
        {recentWhispers.map((e) => {
          const isExpanded = !!expandedWhispers[e.id]
          const noteBody = entryNoteBody(e)
          const toggleExpand = () => setExpandedWhispers((prev) => ({ ...prev, [e.id]: !prev[e.id] }))
          const jumpDetail = (ev: any) => {
            ev?.stopPropagation?.()
            goPracticeDetail(e.practice_session_id)
          }
          return (
            <View key={e.id} className='whisper-item' onClick={toggleExpand}>
              <View className='whisper-pose'>
                <PoseSketch kind={poseKindFor(e)} size={38} />
              </View>
              <View className='whisper-body'>
                <View className='whisper-meta-row'>
                  <View className='whisper-dot' style={{ background: whisperDotColor(e) }} />
                  <Text className='whisper-meta'>{whisperMeta(e)}</Text>
                  <Text className='whisper-caret'>{isExpanded ? '▴' : '▾'}</Text>
                </View>
                {noteBody ? (
                  <EntryNoteText
                    text={noteBody}
                    expanded={isExpanded}
                    collapsedLines={3}
                    variant='card'
                  />
                ) : (
                  <Text className='whisper-fallback'>{entryFallbackText(e)}</Text>
                )}
                {isExpanded && (
                  <Text className='whisper-detail-link' onClick={jumpDetail}>
                    看这次练习 ›
                  </Text>
                )}
              </View>
            </View>
          )
        })}
      </View>

      <Text className='home-footer'>
        下面这颗 <Text className='home-footer-plus'>＋</Text>，是今天想留下的。
      </Text>

      <TabBar active='home' />
    </View>
  )
}
