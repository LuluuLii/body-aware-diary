// Sprint 2.8 · 回顾页
// 数据从多个 supabase 拉取聚合：
//   - practices → 累积次数 · 品类分布 · pose 排行
//   - entries → YearColorGrid 数据源 · 感受词云
//   - body_annotations → 肌肉热度图 · 唤醒过的肌肉数 · top 肌肉
//
// 空态：一次都没记录时给友好引导，不显示零填的卡片。

import { useEffect, useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import {
  ensureProfile,
  getMuscleFrequency,
  listEntries,
  listPractices,
  type ActivityType,
  type BodyAnnotation,
  type DiaryEntry,
  type MuscleFrequency,
  type MuscleSensationTag,
  type PracticeSession,
} from '@body-diary/core'
import type { BodyView } from '@body-diary/assets'
import { getSupabase, ensureAnonymousSession } from '../../lib/supabase'
import { ACTIVITY_TYPE_LABELS, formatLatinHeader } from '../../lib/format'
import { poseName } from '../../lib/poses'
import { TabBar } from '../../components/TabBar'
import { BodyFigure } from '../../components/BodyFigure'
import { YearColorGrid, YearColorGridLegend } from '../../components/YearColorGrid'
import './index.scss'

const SENSATION_LABEL: Record<MuscleSensationTag, string> = {
  soreness: '酸', tightness: '紧', warmth: '温', swell: '涨', none: '无感',
}

// 后视肌肉 asset id · 用于自动判断默认视图
const BACK_ASSET_IDS = new Set([
  'trap', 'delt_bl', 'delt_br', 'lat_l', 'lat_r', 'erector',
  'glute_l', 'glute_r', 'ham_l', 'ham_r', 'calf_l', 'calf_r',
])

export default function Review() {
  const [loading, setLoading] = useState(true)
  const [practices, setPractices] = useState<PracticeSession[]>([])
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [annotations, setAnnotations] = useState<BodyAnnotation[]>([])
  const [muscleFreq, setMuscleFreq] = useState<MuscleFrequency[]>([])
  const [bodyView, setBodyView] = useState<BodyView>('front')
  const [loadErrors, setLoadErrors] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const errors: string[] = []
      try {
        const session = await ensureAnonymousSession()
        if (!session || cancelled) {
          if (!cancelled) {
            errors.push('未登录 / session 失败')
            setLoadErrors(errors)
          }
          return
        }
        const client = getSupabase()
        try { await ensureProfile(client, session.user.id) } catch (e) {
          errors.push(`ensureProfile: ${e instanceof Error ? e.message : String(e)}`)
        }

        // 每源独立容错：一个失败不拖垮其他，且能看到具体是哪个挂了
        try {
          const prs = await listPractices(client, session.user.id, { limit: 500 })
          if (!cancelled) setPractices(prs)
        } catch (e) {
          errors.push(`listPractices: ${e instanceof Error ? e.message : String(e)}`)
        }

        try {
          const ens = await listEntries(client, session.user.id, { limit: 500 })
          if (!cancelled) setEntries(ens)
        } catch (e) {
          errors.push(`listEntries: ${e instanceof Error ? e.message : String(e)}`)
        }

        try {
          const since = new Date('2020-01-01')
          const freq = await getMuscleFrequency(client, session.user.id, since)
          if (!cancelled) setMuscleFreq(freq)
        } catch (e) {
          errors.push(`getMuscleFrequency: ${e instanceof Error ? e.message : String(e)}`)
        }

        try {
          const { data: annData, error: annErr } = await client
            .from('body_annotations')
            .select('*')
            .eq('user_id', session.user.id)
            .limit(2000)
          if (annErr) throw annErr
          if (!cancelled && annData) setAnnotations(annData as BodyAnnotation[])
        } catch (e) {
          errors.push(`annotations: ${e instanceof Error ? e.message : String(e)}`)
        }
      } catch (err) {
        errors.push(`unknown: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        if (!cancelled) {
          setLoadErrors(errors)
          setLoading(false)
        }
      }
    })()
    return () => { cancelled = true }
  }, [])

  // ─── 聚合派生数据 ─────────────────────────────

  const uniqueMuscleCount = useMemo(() => {
    const set = new Set<string>()
    annotations.forEach((a) => set.add(a.muscle_asset_id))
    return set.size
  }, [annotations])

  // pose 频次 top 5（合并 pose_ids + custom_pose_names）
  const topPoses = useMemo(() => {
    const counts = new Map<string, { key: string; label: string; count: number; isCustom: boolean }>()
    practices.forEach((p) => {
      p.pose_ids.forEach((id) => {
        const label = poseName(id) ?? id
        const cur = counts.get(id) ?? { key: id, label, count: 0, isCustom: false }
        cur.count += 1
        counts.set(id, cur)
      })
      p.custom_pose_names.forEach((n) => {
        const key = `__custom:${n}`
        const cur = counts.get(key) ?? { key, label: n, count: 0, isCustom: true }
        cur.count += 1
        counts.set(key, cur)
      })
    })
    return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 5)
  }, [practices])

  // 品类分布（按 practice_sessions.activity_type）
  const activityMix = useMemo(() => {
    const counts = new Map<ActivityType, number>()
    practices.forEach((p) => {
      counts.set(p.activity_type, (counts.get(p.activity_type) ?? 0) + 1)
    })
    const total = practices.length
    return Array.from(counts.entries())
      .map(([type, count]) => ({
        type,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
  }, [practices])

  // 感受词云 top 12（跨所有 entries）
  const sensationWordFreq = useMemo(() => {
    const counts = new Map<string, number>()
    entries.forEach((e) => {
      (e.sensation_words ?? []).forEach((w) => {
        counts.set(w, (counts.get(w) ?? 0) + 1)
      })
    })
    return Array.from(counts.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
  }, [entries])

  // 身体热度图：从 muscleFreq 转成 BodyFigure heatmap { assetId: intensity 0-1 }
  const heatmapData = useMemo(() => {
    if (muscleFreq.length === 0) return {}
    const max = muscleFreq[0].count // freq 已按 count desc 排序
    const map: Record<string, number> = {}
    muscleFreq.forEach((m) => {
      map[m.muscle_asset_id] = m.count / max
    })
    return map
  }, [muscleFreq])

  // Top 3 肌肉（当前视图匹配的）
  const currentSideMuscles = useMemo(() => {
    return muscleFreq
      .filter((m) => {
        const isBack = BACK_ASSET_IDS.has(m.muscle_asset_id)
        return bodyView === 'back' ? isBack : !isBack
      })
      .slice(0, 3)
  }, [muscleFreq, bodyView])

  // 该肌肉最常出现的 sensation tag
  const dominantTag = (m: MuscleFrequency): MuscleSensationTag | null => {
    const tags = m.by_tag
    let best: MuscleSensationTag | null = null
    let bestCount = 0
    ;(Object.keys(tags) as MuscleSensationTag[]).forEach((t) => {
      if (t === 'none') return
      if (tags[t] > bestCount) { best = t; bestCount = tags[t] }
    })
    return best
  }

  const goRecord = () => Taro.reLaunch({ url: '/pages/record/index' })

  // ─── Render ─────────────────────────────

  const hasAnyData = practices.length > 0 || entries.length > 0

  return (
    <View className='review-page paper-grid-bg'>
      {/* Latin small header */}
      <Text className='latin-header'>{formatLatinHeader()}</Text>
      <Text className='page-title'>回顾一下</Text>
      <Text className='page-sub'>你的身体这段时间在讲什么。</Text>

      {loading && (
        <View className='review-loading'>
          <Text className='loading-text'>加载中…</Text>
        </View>
      )}

      {!loading && loadErrors.length > 0 && (
        <View className='review-errors'>
          <Text className='review-errors-title'>加载时有问题：</Text>
          {loadErrors.map((err, i) => (
            <Text key={i} className='review-error-item'>· {err}</Text>
          ))}
        </View>
      )}

      {!loading && !hasAnyData && (
        <View className='empty-card'>
          <Text className='empty-title'>还没有记录</Text>
          <Text className='empty-sub'>点下方＋记下第一次练习，这里就会慢慢长出你的图案。</Text>
          <View className='empty-cta' onClick={goRecord}>
            <Text className='empty-cta-label'>去记录</Text>
          </View>
        </View>
      )}

      {!loading && hasAnyData && (
        <>
          {/* 累积统计 */}
          <View className='stat-row'>
            <View className='stat-cell'>
              <Text className='stat-num'>{practices.length}</Text>
              <Text className='stat-label'>次练习</Text>
            </View>
            <View className='stat-cell'>
              <Text className='stat-num'>{entries.length}</Text>
              <Text className='stat-label'>条记录</Text>
            </View>
            <View className='stat-cell'>
              <Text className='stat-num'>{uniqueMuscleCount}</Text>
              <Text className='stat-label'>块肌肉唤醒</Text>
            </View>
          </View>

          {/* 年度身体色卡 */}
          <View className='year-card'>
            <View className='year-head'>
              <Text className='year-title'>身体色卡 · 每一格是一天</Text>
            </View>
            <View className='year-grid-slot'>
              <YearColorGrid
                entries={entries}
                weeks={53}
                cellSize={10}
                gap={2}
                onDark
              />
            </View>
            <View className='year-legend-slot'>
              <YearColorGridLegend onDark />
            </View>
          </View>

          {/* 身体热度图 */}
          {muscleFreq.length > 0 && (
            <View className='body-heat-card'>
              <View className='body-heat-head'>
                <Text className='body-heat-title'>身体地图 · 谁被反复唤醒</Text>
                <View className='view-tabs'>
                  <Text
                    className={`view-tab ${bodyView === 'front' ? 'active' : ''}`}
                    onClick={() => setBodyView('front')}
                  >前视</Text>
                  <Text
                    className={`view-tab ${bodyView === 'back' ? 'active' : ''}`}
                    onClick={() => setBodyView('back')}
                  >后视</Text>
                </View>
              </View>
              <View className='body-heat-body'>
                <View className='body-heat-fig'>
                  <BodyFigure
                    view={bodyView}
                    mode='heatmap'
                    heatmap={heatmapData}
                    size={130}
                  />
                </View>
                <View className='body-heat-list'>
                  {currentSideMuscles.length === 0 ? (
                    <Text className='body-heat-empty'>{bodyView === 'back' ? '后视' : '前视'} 还没有标注</Text>
                  ) : currentSideMuscles.map((m) => {
                    const tag = dominantTag(m)
                    return (
                      <View key={m.muscle_asset_id} className='body-heat-item'>
                        <Text className='body-heat-item-name'>{m.muscle_asset_id}</Text>
                        <Text className='body-heat-item-meta'>
                          {m.count} 次{tag ? ` · 常${SENSATION_LABEL[tag]}` : ''}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              </View>
            </View>
          )}

          {/* 最常做的动作 */}
          {topPoses.length > 0 && (
            <View className='top-list-card'>
              <Text className='card-label'>最常做的动作</Text>
              <View className='top-list'>
                {topPoses.map((p, i) => (
                  <View key={p.key} className='top-list-item'>
                    <Text className='top-list-rank'>{i + 1}</Text>
                    <Text className='top-list-name'>{p.label}</Text>
                    {p.isCustom && <Text className='top-list-custom'>自记</Text>}
                    <Text className='top-list-count'>{p.count} 次</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 品类分布 */}
          {activityMix.length > 0 && (
            <View className='mix-card'>
              <Text className='card-label'>品类分布</Text>
              <View className='mix-bar'>
                {activityMix.map((a, i) => (
                  <View
                    key={a.type}
                    className={`mix-seg mix-seg-${i}`}
                    style={{ flex: a.count }}
                  />
                ))}
              </View>
              <View className='mix-legend'>
                {activityMix.map((a, i) => (
                  <View key={a.type} className='mix-legend-item'>
                    <View className={`mix-dot mix-seg-${i}`} />
                    <Text className='mix-legend-label'>
                      {ACTIVITY_TYPE_LABELS[a.type]} · {a.pct}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 感受词云 */}
          {sensationWordFreq.length > 0 && (
            <View className='word-card'>
              <Text className='card-label'>你最常写下的感受</Text>
              <View className='word-cloud'>
                {sensationWordFreq.map((w) => {
                  // font size scale 12-18 by count
                  const max = sensationWordFreq[0].count
                  const scale = w.count / max
                  const fs = 12 + Math.round(scale * 6)
                  return (
                    <Text
                      key={w.word}
                      className='cloud-word'
                      style={{ fontSize: `${fs}px`, opacity: 0.6 + scale * 0.4 }}
                    >{w.word} · {w.count}</Text>
                  )
                })}
              </View>
            </View>
          )}
        </>
      )}

      <TabBar active='review' />
    </View>
  )
}
