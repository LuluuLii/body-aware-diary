// Sprint 2.5 · Practice Detail 页
// URL: /pages/practice-detail/index?id=xxx
//
// 展示一次练习的全部信息:
//   - Header: 返回 + 日期
//   - Practice meta: 活动类型 + 主体式 + 第 N 次练习
//   - 首条记录（primary）: 完整感受 · body annotation 摘要
//   - 后续 follow-up 记录列表（时间顺序）
//   - "追加感受" 内联输入区（简易 textarea + 提交）

import { useEffect, useMemo, useState } from 'react'
import { View, Text, Textarea } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import {
  addFollowUpEntry,
  ensureProfile,
  getPractice,
  listAnnotationsForEntry,
  listEntriesInPractice,
  type BodyAnnotation,
  type DiaryEntry,
  type MuscleSensationTag,
  type PracticeSession,
} from '@body-diary/core'
import { poseName } from '../../lib/poses'
import { IconArrowLeft } from '../../lib/icons'
import { getSupabase, ensureAnonymousSession } from '../../lib/supabase'
import { ACTIVITY_TYPE_LABELS, formatShortDate, daysAgoLabel } from '../../lib/format'
import { BodyFigure } from '../../components/BodyFigure'
import { EntryNoteText } from '../../components/EntryNoteText'
import './index.scss'

function relativeTimeLabel(iso: string, now: Date = new Date()): string {
  const t = new Date(iso).getTime()
  const diffMs = now.getTime() - t
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} 小时前`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay} 天前`
  return formatShortDate(iso)
}

export default function PracticeDetail() {
  const router = useRouter()
  const practiceId = (router.params?.id as string | undefined) ?? ''

  const [practice, setPractice] = useState<PracticeSession | null>(null)
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [annotationsByEntry, setAnnotationsByEntry] = useState<Record<string, BodyAnnotation[]>>({})
  const [loading, setLoading] = useState(true)

  // Follow-up quick-add
  const [followText, setFollowText] = useState('')
  const [submittingFollow, setSubmittingFollow] = useState(false)

  const load = async () => {
    // 缺 ID (比如用户手动开这个 URL): 不阻塞在 loading, 让 !practice 分支渲染
    // "缺参数" 提示 + 返回首页, 不要永远转圈.
    if (!practiceId) {
      setLoading(false)
      return
    }
    try {
      const session = await ensureAnonymousSession()
      if (!session) return
      const client = getSupabase()
      await ensureProfile(client, session.user.id)
      const [p, es] = await Promise.all([
        getPractice(client, practiceId),
        listEntriesInPractice(client, practiceId),
      ])
      setPractice(p)
      setEntries(es)
      // Fetch annotations for all entries in parallel
      const annPairs = await Promise.all(
        es.map(async (e) => [e.id, await listAnnotationsForEntry(client, e.id)] as const),
      )
      const annMap: Record<string, BodyAnnotation[]> = {}
      annPairs.forEach(([id, a]) => { annMap[id] = a })
      setAnnotationsByEntry(annMap)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[practice-detail] load failed', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()

  }, [practiceId])

  const goBack = () => Taro.navigateBack()
  const primaryEntry = entries[0]
  const followUps = entries.slice(1)
  const totalAnnotations = useMemo(
    () => Object.values(annotationsByEntry).reduce((sum, a) => sum + a.length, 0),
    [annotationsByEntry],
  )

  const handleFollowSubmit = async () => {
    if (!practice || submittingFollow) return
    const text = followText.trim()
    if (!text) return
    setSubmittingFollow(true)
    try {
      const session = await ensureAnonymousSession()
      if (!session) throw new Error('No session')
      const client = getSupabase()
      await addFollowUpEntry(client, session.user.id, practice.id, {
        activation_note: text,
        sensation_words: [],
        annotations: [],
      })
      setFollowText('')
      await load()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[practice-detail] follow-up failed', err)
      Taro.showToast({ title: '追加失败', icon: 'none' })
    } finally {
      setSubmittingFollow(false)
    }
  }

  // IconArrowLeft 颜色: weapp 端 icons 是 SVG data URL, 拿不到 CSS var,
  // 传 hex (对应 --color-text-secondary in fresh theme).
  const iconBackColor = '#8A8770'

  if (loading) {
    return (
      <View className='practice-detail-page paper-grid-bg'>
        <View className='top-bar'>
          <View className='back-btn' onClick={goBack}>
            <IconArrowLeft size={17} color={iconBackColor} />
          </View>
        </View>
        <View className='loading-state'>
          <Text className='loading-text'>加载中…</Text>
        </View>
      </View>
    )
  }

  if (!practice) {
    const goHome = () => Taro.reLaunch({ url: '/pages/home/index' })
    return (
      <View className='practice-detail-page paper-grid-bg'>
        <View className='top-bar'>
          <View className='back-btn' onClick={goBack}>
            <IconArrowLeft size={17} color={iconBackColor} />
          </View>
        </View>
        <View className='not-found'>
          <Text className='not-found-title'>
            {practiceId ? '没找到这次练习' : '缺少练习 ID'}
          </Text>
          <Text className='not-found-sub'>
            {practiceId
              ? '这条记录可能已经被删了。'
              : '请从「回顾」或「日记本」里点具体某条记录进入。'}
          </Text>
          <View className='not-found-cta' onClick={goHome}>
            <Text className='not-found-cta-label'>回首页</Text>
          </View>
        </View>
      </View>
    )
  }

  // v2.7-B: 用 poseName() 统一查内置 + 用户自建
  const allPoseNames = [
    ...practice.pose_ids.map((id) => poseName(id)).filter(Boolean) as string[],
    ...practice.custom_pose_names,
  ]
  const poseNameDisplay = allPoseNames.length === 0
    ? null
    : allPoseNames.length <= 3
      ? allPoseNames.join(' · ')
      : `${allPoseNames.slice(0, 3).join(' · ')} · +${allPoseNames.length - 3}`
  const activityLabel = ACTIVITY_TYPE_LABELS[practice.activity_type] ?? '记录'
  const primaryAnnotations = primaryEntry ? annotationsByEntry[primaryEntry.id] ?? [] : []
  const annotationsMap = primaryAnnotations.reduce<Record<string, MuscleSensationTag>>((acc, a) => {
    if (a.muscle_asset_id) acc[a.muscle_asset_id] = a.sensation
    return acc
  }, {})

  return (
    <View className='practice-detail-page paper-grid-bg'>
      {/* Top bar */}
      <View className='top-bar'>
        <View className='back-btn' onClick={goBack}>
          <IconArrowLeft size={17} color='var(--color-text-secondary)' />
        </View>
        <Text className='top-date'>Date · {formatShortDate(practice.practiced_at)}</Text>
      </View>

      {/* Practice meta */}
      <Text className='practice-label'>第 {practice.practice_number} 次练习 · {daysAgoLabel(practice.practiced_at)}</Text>
      <Text className='practice-title'>
        {activityLabel}
        {poseNameDisplay ? ` · ${poseNameDisplay}` : ''}
      </Text>
      <Text className='practice-summary'>
        {entries.length} 条记录 · {totalAnnotations} 处身体标注
      </Text>

      {/* 首条记录 - primary */}
      {primaryEntry && (
        <View className='primary-card'>
          <View className='primary-head'>
            <Text className='primary-label'>当场记录</Text>
            <View className='primary-head-actions'>
              <Text className='primary-time'>{relativeTimeLabel(primaryEntry.created_at)}</Text>
              <Text
                className='primary-edit-btn'
                onClick={() => Taro.navigateTo({ url: `/pages/record/index?entry_id=${primaryEntry.id}` })}
              >编辑 ›</Text>
            </View>
          </View>
          {primaryEntry.sensation_words && primaryEntry.sensation_words.length > 0 && (
            <View className='primary-words'>
              {primaryEntry.sensation_words.map((w) => (
                <Text key={w} className='primary-word'>{w}</Text>
              ))}
            </View>
          )}
          {primaryEntry.activation_note && (
            <View className='primary-note-wrap'>
              <EntryNoteText
                text={primaryEntry.activation_note}
                expanded
                variant='detail'
              />
            </View>
          )}
          {primaryAnnotations.length > 0 && (
            <View className='primary-body'>
              <View className='primary-body-fig'>
                <BodyFigure
                  view='front'
                  mode='readonly'
                  annotations={annotationsMap}
                  size={66}
                />
              </View>
              <View className='primary-body-info'>
                <Text className='primary-body-count'>{primaryAnnotations.length} 处标注</Text>
                <Text className='primary-body-list'>
                  {primaryAnnotations.map((a) => `${a.muscle_asset_id}`).join(' · ')}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Follow-up 记录列表 */}
      {followUps.length > 0 && (
        <View className='followup-section'>
          <Text className='followup-section-label'>之后的感受</Text>
          {followUps.map((e) => (
            <View key={e.id} className='followup-card'>
              <View className='followup-head'>
                <Text className='followup-time'>{relativeTimeLabel(e.created_at)}</Text>
              </View>
              {e.activation_note && (
                <Text className='followup-note'>{e.activation_note}</Text>
              )}
              {e.sensation_words && e.sensation_words.length > 0 && (
                <View className='followup-words'>
                  {e.sensation_words.map((w) => (
                    <Text key={w} className='followup-word'>{w}</Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* 追加感受 · 内联 quick add */}
      <View className='follow-add'>
        <View className='follow-add-title-row'>
          <Text className='follow-add-label'>追加一条感受</Text>
          <Text
            className='follow-add-more-link'
            onClick={() => Taro.navigateTo({ url: '/pages/record/index' })}
          >记录更多 ›</Text>
        </View>
        <Text className='follow-add-hint'>比如：睡了一觉，臀部还在酸。</Text>
        <Textarea
          className='follow-add-textarea'
          value={followText}
          placeholder='写下此刻身体想告诉你的…（可选）'
          onInput={(e) => setFollowText(e.detail.value ?? '')}
          maxlength={280}
          autoHeight
        />
        <View
          className={`follow-add-submit ${followText.trim() && !submittingFollow ? 'active' : ''}`}
          onClick={followText.trim() && !submittingFollow ? handleFollowSubmit : undefined}
        >
          <Text className='follow-add-submit-label'>
            {submittingFollow ? '追加中...' : '追加'}
          </Text>
        </View>
      </View>
    </View>
  )
}
