// Sprint 2 · 日记本页
// - Header: My Journal (Caveat) + "全部 · N 篇"
// - Serif 标题 + 观察式副句
// - Tab: 时间线 / 按训练类型
// - 时间线: 按月分组，每条卡片可点开展开
// - 按训练类型: 按 activity_type 分组
// - 卡片: pose 简笔 + Caveat 日期 + type + 感受色标签 + 一句话摘录
// - 展开: 发力感笔记 + 时长（占位）+ 身体标注处数

import { useEffect, useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
import {
  ensureProfile,
  listEntries,
  listAnnotationsForEntry,
  type BodyAnnotation,
  type DiaryEntry,
  type ActivityType,
} from '@body-diary/core'
import { getPoseById } from '@body-diary/content'
import { PoseSketch, type PoseKind } from '@body-diary/assets'
import { getSupabase, ensureAnonymousSession } from '../../lib/supabase'
import {
  ACTIVITY_TYPE_LABELS,
  formatShortDate,
  formatMonthLabel,
} from '../../lib/format'
import { TabBar } from '../../components/TabBar'
import { EntryNoteText } from '../../components/EntryNoteText'
import './index.scss'

type DiaryViewMode = 'timeline' | 'byType'

function poseKindFor(entry: DiaryEntry): PoseKind {
  const first = entry.pose_ids?.[0]
  if (first) {
    const pose = getPoseById(first)
    if (pose) return pose.sketchKind
  }
  return 'seated'
}

/** 拿到用户手写正文；否则 null 走 fallback。 */
function entryNoteBody(e: DiaryEntry): string | null {
  const a = e.activation_note?.trim()
  if (a) return a
  const c = e.content?.trim()
  if (c) return c
  return null
}

/** 无正文的占位文案。 */
function entryFallbackText(e: DiaryEntry): string {
  if (e.sensation_words?.length) return e.sensation_words.map((w) => `#${w}`).join(' ')
  return '（这条只留了身体标注）'
}

function entryTagDots(e: DiaryEntry): { label: string; color: string }[] {
  const words = e.sensation_words ?? []
  const y = e.sensation_coord?.y
  const baseColor =
    y === null || y === undefined ? 'var(--sensation-none)' :
    y >= 0 ? 'var(--sensation-swell)' : 'var(--sensation-tight)'
  return words.slice(0, 3).map((w) => ({ label: w, color: baseColor }))
}

interface Group {
  key: string
  label: string
  entries: DiaryEntry[]
}

function groupByMonth(entries: DiaryEntry[]): Group[] {
  const map = new Map<string, DiaryEntry[]>()
  for (const e of entries) {
    const d = new Date(e.created_at)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const arr = map.get(key) ?? []
    arr.push(e)
    map.set(key, arr)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, es]) => {
      const [y, m] = key.split('-').map(Number)
      return { key, label: formatMonthLabel(y, m), entries: es }
    })
}

function groupByType(entries: DiaryEntry[]): Group[] {
  const map = new Map<ActivityType, DiaryEntry[]>()
  for (const e of entries) {
    const arr = map.get(e.activity_type) ?? []
    arr.push(e)
    map.set(e.activity_type, arr)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([type, es]) => ({
      key: type,
      label: ACTIVITY_TYPE_LABELS[type] ?? type,
      entries: es,
    }))
}

export default function Diary() {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [viewMode, setViewMode] = useState<DiaryViewMode>('timeline')
  const [openId, setOpenId] = useState<string | null>(null)
  const [annotationsMap, setAnnotationsMap] = useState<Record<string, BodyAnnotation[]>>({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const session = await ensureAnonymousSession()
        if (!session || cancelled) return
        const client = getSupabase()
        await ensureProfile(client, session.user.id)
        const list = await listEntries(client, session.user.id, { limit: 200 })
        if (!cancelled) setEntries(list)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[diary] load failed', err)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const groups = useMemo(
    () => viewMode === 'timeline' ? groupByMonth(entries) : groupByType(entries),
    [viewMode, entries],
  )

  // Lazy-load annotations when expanding
  useEffect(() => {
    if (!openId) return
    if (annotationsMap[openId]) return
    ;(async () => {
      try {
        const client = getSupabase()
        const ann = await listAnnotationsForEntry(client, openId)
        setAnnotationsMap((prev) => ({ ...prev, [openId]: ann }))
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[diary] load annotations failed', err)
      }
    })()
  }, [openId, annotationsMap])

  const toggleOpen = (id: string) => {
    setOpenId((cur) => (cur === id ? null : id))
  }

  return (
    <View className='diary-page paper-grid-bg'>
      <View className='top-row'>
        <Text className='latin-title'>My Journal</Text>
        <Text className='count-pill'>全部 · {entries.length} 篇</Text>
      </View>
      <Text className='page-title'>日记本</Text>
      <Text className='page-sub'>每一条都还在。想它的时候，就回来翻翻。</Text>

      {/* Tabs */}
      <View className='diary-tabs'>
        <Text
          className={`diary-tab ${viewMode === 'timeline' ? 'active' : ''}`}
          onClick={() => setViewMode('timeline')}
        >时间线</Text>
        <Text
          className={`diary-tab ${viewMode === 'byType' ? 'active' : ''}`}
          onClick={() => setViewMode('byType')}
        >按训练类型</Text>
      </View>

      {entries.length === 0 && (
        <View className='diary-empty'>
          <Text className='diary-empty-text'>
            还没有留下过什么。点下方 ＋ 开始你的第一条。
          </Text>
        </View>
      )}

      {groups.map((g) => (
        <View key={g.key} className='diary-group'>
          <View className='group-head'>
            <Text className='group-label'>{g.label}</Text>
            <Text className='group-count'>{g.entries.length} 篇</Text>
          </View>
          {g.entries.map((e) => {
            const isOpen = openId === e.id
            const tags = entryTagDots(e)
            const ann = annotationsMap[e.id]
            return (
              <View
                key={e.id}
                className={`diary-card ${isOpen ? 'open' : ''}`}
                onClick={() => toggleOpen(e.id)}
              >
                <View className='card-main'>
                  <View className='card-pose'>
                    <PoseSketch kind={poseKindFor(e)} size={40} />
                  </View>
                  <View className='card-body'>
                    <View className='card-meta-row'>
                      <Text className='card-date'>{formatShortDate(e.created_at)}</Text>
                      <Text className='card-type'>
                        {ACTIVITY_TYPE_LABELS[e.activity_type] ?? '记录'}
                      </Text>
                      <Text className='card-caret'>{isOpen ? '▴' : '▾'}</Text>
                    </View>
                    {(() => {
                      const noteBody = entryNoteBody(e)
                      return noteBody ? (
                        <EntryNoteText
                          text={noteBody}
                          expanded={isOpen}
                          collapsedLines={3}
                          variant='card'
                        />
                      ) : (
                        <Text className='card-fallback'>{entryFallbackText(e)}</Text>
                      )
                    })()}
                    {tags.length > 0 && (
                      <View className='card-tags'>
                        {tags.map((t, i) => (
                          <Text key={`t-${i}`} className='card-tag'>
                            <View className='card-tag-dot' style={{ background: t.color }} />
                            {t.label}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
                {isOpen && (
                  <View className='card-expand'>
                    {/* 发力感正文已由 EntryNoteText 在上方展开显示，此处只补 metadata */}
                    <View className='expand-meta'>
                      {e.duration_minutes && (
                        <Text className='expand-meta-item'>{e.duration_minutes} 分钟</Text>
                      )}
                      <Text className='expand-meta-item'>
                        {ann ? `身体标注 ${ann.length} 处` : '身体标注 加载中…'}
                      </Text>
                      <Text className='expand-meta-item'>
                        第 {e.session_number ?? '-'} 次
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )
          })}
        </View>
      ))}

      {entries.length > 0 && (
        <Text className='diary-footer'>再往前，是你刚开始的那些日子。</Text>
      )}

      <TabBar active='diary' />
    </View>
  )
}
