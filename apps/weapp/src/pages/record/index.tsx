// Sprint 2.6 · Record 页大改
// 布局顺序 (由上至下，中段可滚，"记下了"按钮 fixed 底部)：
//   1. Top bar (返回 + 手写日期)
//   2. 大标题 + 右侧小字"第 x 次"
//   3. 品类 chip 行 (5 类，去掉 4 个暂不用的)
//   4. 发力感 · 课堂笔记 (首要，textarea)
//   5. 选{体式/动作/泳姿} - 品类联动 · pose picker inline
//   6. 感受与身体 合卡 (SensationPicker bare + 身体图入口)
//   7. 更多字段平铺 (时长/语音/照片占位)
//   8. Fixed bottom "记下了" 按钮
//
// 关键交互:
//   - 品类切换会 reset pose 选择（否则 芭蕾 pose 保留到 垫上 上下文语义错）
//   - Pose picker: 有本地数据的品类 (垫上/芭蕾) 按 family 分组展示 chip，
//     无数据的 (游泳/力量/其他) 只显示自定义输入
//   - 提交按钮 fixed 底部并加 safe-area padding

import { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import {
  bulkInsertAnnotations,
  createPracticeWithFirstEntry,
  deleteAllAnnotationsForEntry,
  ensureProfile,
  getEntry,
  getPractice,
  listAnnotationsForEntry,
  updateEntry,
  updatePractice,
  type ActivityType,
  type DiaryEntryDraft,
  type MuscleSensationTag,
} from '@body-diary/core'
import {
  ONBOARDING_TIPS,
  pickRecordPlaceholder,
  RECORD_PLACEHOLDER_NEW_USER,
} from '@body-diary/content'
import { poseName, resolvePose } from '../../lib/poses'
import { IconArrowLeft, IconCloseBook } from '../../lib/icons'
import { getSupabase, ensureAnonymousSession } from '../../lib/supabase'
import { useAppStore } from '../../store/useAppStore'
import { BodyFigure } from '../../components/BodyFigure'
import { BodyMapOverlay } from '../../components/BodyMapOverlay'
import { SensationPicker, type SensationValue } from '../../components/SensationPicker'
import { OnboardingTipModal } from '../../components/OnboardingTipModal'
import { PosePickerSheet } from '../../components/PosePickerSheet'
import { AutoTextarea } from '../../components/AutoTextarea'
import { POSE_NOUN_BY_ACTIVITY } from '../../lib/format'
import './index.scss'

function formatHandwrittenDate(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y} · ${m} · ${d}`
}

// v2.6 · 记录页只曝光核心 5 品类。DB enum 里保留 running/cycling/hiking/rehabilitation，
// 供未来数据接入或用户手动切；现在 UI 不打扰新用户。
const ACTIVITY_CHOICES: readonly { key: ActivityType; label: string }[] = [
  { key: 'yoga_mat', label: '垫上' },
  { key: 'ballet',   label: '芭蕾' },
  { key: 'swimming', label: '游泳' },
  { key: 'strength', label: '力量' },
  { key: 'other',    label: '其他' },
]

export default function Record() {
  const router = useRouter()
  // v2.7-A · 编辑模式：URL ?entry_id=xxx 传入 → 加载现有数据、走 update 分支
  const editingEntryId = (router.params?.entry_id as string | undefined) || null
  const isEditing = editingEntryId !== null

  const [sessionNumber, setSessionNumber] = useState<number | null>(null)
  const [editingPracticeId, setEditingPracticeId] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState<boolean>(isEditing) // 编辑模式要等数据 load 完
  const [annotations, setAnnotations] = useState<Record<string, MuscleSensationTag>>({})
  // v2.7-A · 每块肌肉标注可选关联到 practice.pose_ids 里的一个 pose
  const [annotationPoseIds, setAnnotationPoseIds] = useState<Record<string, string | null>>({})
  const [bodyOpen, setBodyOpen] = useState(false)
  const [sensation, setSensation] = useState<SensationValue>({ coord: null, words: [] })
  const [activationNote, setActivationNote] = useState<string>('')
  const [activityType, setActivityType] = useState<ActivityType>('yoga_mat')
  // v2.7-A: pose 多选 · 两个数组（内置 id + 纯文字自定义）
  const [selectedPoseIds, setSelectedPoseIds] = useState<string[]>([])
  const [selectedCustomNames, setSelectedCustomNames] = useState<string[]>([])
  const [posePickerOpen, setPosePickerOpen] = useState<boolean>(false)
  const [pickerRerenderKey, setPickerRerenderKey] = useState<number>(0) // 用于打开 sheet 时重置内部 draft state
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [closing, setClosing] = useState<boolean>(false)

  // Onboarding: 首次进 record 弹 tip
  const onboardingSeen = useAppStore((s) => s.onboardingSeen)
  const markOnboardingSeen = useAppStore((s) => s.markOnboardingSeen)
  // 编辑模式不弹 onboarding tip（那是首次新建时的引导）
  const showRecordTip = !isEditing && !onboardingSeen.includes('record')

  const activationPlaceholder = useMemo(
    () => sessionNumber !== null ? pickRecordPlaceholder(sessionNumber) : RECORD_PLACEHOLDER_NEW_USER,
    [sessionNumber],
  )

  const poseNoun = POSE_NOUN_BY_ACTIVITY[activityType]

  // 用于 summary row 展示已选 pose 名字（内置 + 用户自建 + 纯文字自定义）
  const selectedNamesForDisplay = useMemo(() => {
    const named = selectedPoseIds.map((id) => poseName(id)).filter(Boolean) as string[]
    return [...named, ...selectedCustomNames]
  }, [selectedPoseIds, selectedCustomNames])

  // 传给 BodyMap 用于"关联 pose"的 chip 数据（内置 + 用户自建统一 shape）
  const availablePosesForBody = useMemo(
    () => selectedPoseIds
      .map((id) => {
        const r = resolvePose(id)
        return r ? { id: r.id, nameZh: r.nameZh } : null
      })
      .filter(Boolean) as { id: string; nameZh: string }[],
    [selectedPoseIds],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const session = await ensureAnonymousSession()
        if (!session || cancelled) return
        const client = getSupabase()
        await ensureProfile(client, session.user.id)

        if (isEditing && editingEntryId) {
          // 编辑模式：拉取 entry + practice + annotations，回填全部字段
          const entry = await getEntry(client, editingEntryId)
          if (!entry || cancelled) {
            if (!cancelled) setInitialLoading(false)
            return
          }
          const [practice, anns] = await Promise.all([
            getPractice(client, entry.practice_session_id),
            listAnnotationsForEntry(client, entry.id),
          ])
          if (cancelled) return
          setEditingPracticeId(entry.practice_session_id)
          if (practice) {
            setActivityType(practice.activity_type)
            setSelectedPoseIds([...practice.pose_ids])
            setSelectedCustomNames([...practice.custom_pose_names])
            setSessionNumber(practice.practice_number) // 展示原始 "第 N 次"
          }
          setActivationNote(entry.activation_note ?? '')
          setSensation({
            coord: entry.sensation_coord ?? null,
            words: [...(entry.sensation_words ?? [])],
          })
          // 回填 annotations + pose 关联
          const annMap: Record<string, MuscleSensationTag> = {}
          const annPoseMap: Record<string, string | null> = {}
          anns.forEach((a) => {
            annMap[a.muscle_asset_id] = a.sensation
            if (a.pose_id) annPoseMap[a.muscle_asset_id] = a.pose_id
          })
          setAnnotations(annMap)
          setAnnotationPoseIds(annPoseMap)
          setInitialLoading(false)
        } else {
          // 新建模式：拿下一个 practice_number 用于展示
          const { data, error } = await client.rpc('next_practice_number', { p_user_id: session.user.id })
          if (error) throw error
          if (!cancelled) setSessionNumber(data ?? 1)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[record] mount failed', err)
        if (!cancelled) setInitialLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [isEditing, editingEntryId])

  // 切换品类时清空 pose 选择（芭蕾 pose 不该带到垫上上下文）
  const handleActivityChange = (next: ActivityType) => {
    if (next === activityType) return
    setActivityType(next)
    setSelectedPoseIds([])
    setSelectedCustomNames([])
  }

  const openPosePicker = () => {
    setPickerRerenderKey((k) => k + 1)
    setPosePickerOpen(true)
  }

  const handlePickerDone = (ids: string[], names: string[]) => {
    setSelectedPoseIds(ids)
    setSelectedCustomNames(names)
    setPosePickerOpen(false)
  }

  // 有前页就返回前页（编辑 or 从 practice-detail "记录更多" 跳来）；否则 fallback 到首页
  const goBack = () => {
    const pages = Taro.getCurrentPages()
    if (pages.length > 1) Taro.navigateBack()
    else Taro.reLaunch({ url: '/pages/home/index' })
  }

  const annotationCount = Object.keys(annotations).length
  const hasSensation = sensation.coord !== null || sensation.words.length > 0
  const hasActivation = activationNote.trim().length > 0
  const hasPose = selectedPoseIds.length > 0 || selectedCustomNames.length > 0
  const hasContent = annotationCount > 0 || hasSensation || hasActivation || hasPose

  const notReadyToast = (msg: string) => Taro.showToast({ title: msg, icon: 'none', duration: 1600 })

  const handleSubmit = async () => {
    if (submitting || closing || !hasContent) return
    setSubmitting(true)
    try {
      const session = await ensureAnonymousSession()
      if (!session) throw new Error('No session')
      const client = getSupabase()
      await ensureProfile(client, session.user.id)

      const annotationDrafts = Object.entries(annotations).map(([muscle_asset_id, tag]) => ({
        muscle_asset_id,
        sensation: tag,
        pose_id: annotationPoseIds[muscle_asset_id] ?? null,
      }))

      if (isEditing && editingEntryId && editingPracticeId) {
        // ─── 编辑模式：update practice + entry + 替换 annotations ───
        await updatePractice(client, editingPracticeId, {
          activity_type: activityType,
          pose_ids: selectedPoseIds,
          custom_pose_names: selectedCustomNames,
        })
        await updateEntry(client, editingEntryId, {
          sensation_coord: sensation.coord,
          sensation_words: sensation.words,
          activation_note: activationNote.trim() || null,
          activity_type: activityType,
          pose_ids: selectedPoseIds,
          custom_pose_names: selectedCustomNames,
        })
        // Annotations 简单换新：先删旧全部，再批量插入
        await deleteAllAnnotationsForEntry(client, editingEntryId)
        if (annotationDrafts.length > 0) {
          await bulkInsertAnnotations(client, editingEntryId, session.user.id, annotationDrafts)
        }
        Taro.showToast({ title: '已保存修改', icon: 'success', duration: 1200 })
        setTimeout(() => Taro.navigateBack(), 400)
        return
      }

      // ─── 新建模式：走原本的 createPracticeWithFirstEntry ───
      const draft: DiaryEntryDraft = {
        sensation_coord: sensation.coord,
        sensation_words: sensation.words,
        activation_note: activationNote.trim() || null,
        activity_type: activityType,
        pose_ids: selectedPoseIds,
        custom_pose_names: selectedCustomNames,
        annotations: annotationDrafts,
        photo_urls: [],
      }
      await createPracticeWithFirstEntry(client, session.user.id, draft)

      setClosing(true)
      setTimeout(() => {
        Taro.reLaunch({ url: '/pages/home/index' })
      }, 1500)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[record submit]', err)
      const msg = err instanceof Error ? err.message : '保存失败'
      Taro.showToast({ title: `没能保存下来 · ${msg}`, icon: 'none', duration: 2600 })
      setSubmitting(false)
    }
  }

  const bodyEntryLabel = annotationCount > 0
    ? `已标 ${annotationCount} 块肌肉`
    : '点这里，标注今天被唤醒的肌肉'

  // 编辑模式下未加载完不渲染 form —— Textarea autoHeight 在 mount 时若 value=''
  // 会把高度锁在最小，之后 setState 到长文时不会重新采样 scrollHeight，只显示第一行。
  // 等数据 load 完再 mount Textarea 确保初始 value 即为完整文本。
  if (isEditing && initialLoading) {
    return (
      <View className='record-page paper-grid-bg'>
        <View className='record-scroll'>
          <View className='top-bar'>
            <View className='back-btn' onClick={goBack}>
              <IconArrowLeft size={17} color='var(--color-text-secondary)' />
            </View>
            <Text className='date-hand'>{formatHandwrittenDate()}</Text>
          </View>
          <View className='page-title-row'>
            <Text className='page-title'>修改当场记录</Text>
          </View>
          <View className='loading-inline'>
            <Text className='loading-text'>加载中…</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className='record-page paper-grid-bg'>
      {/* ─── 中间可滚区域 ─── */}
      <View className='record-scroll'>
        {/* Top bar */}
        <View className='top-bar'>
          <View className='back-btn' onClick={goBack}>
            <IconArrowLeft size={17} color='var(--color-text-secondary)' />
          </View>
          <Text className='date-hand'>{formatHandwrittenDate()}</Text>
        </View>

        {/* Title + inline count */}
        <View className='page-title-row'>
          <Text className='page-title'>
            {isEditing ? '修改当场记录' : '今天想留下什么？'}
          </Text>
          {sessionNumber !== null && (
            <Text className='page-count'>第 {sessionNumber} 次</Text>
          )}
        </View>

        {/* 品类 chip row */}
        <ScrollView className='activity-row' scrollX enhanced showScrollbar={false}>
          {ACTIVITY_CHOICES.map((a) => (
            <Text
              key={a.key}
              className={`activity-chip ${activityType === a.key ? 'active' : ''}`}
              onClick={() => handleActivityChange(a.key)}
            >{a.label}</Text>
          ))}
        </ScrollView>

        {/* 1. 发力感 · 课堂笔记 (提到最前) */}
        <View className='activation-card'>
          <View className='activation-title-row'>
            <View className='activation-dot' />
            <Text className='activation-title'>发力感 · 课堂笔记</Text>
          </View>
          {/* AutoTextarea · H5 走原生, weapp 走 Taro Textarea */}
          <AutoTextarea
            className='activation-textarea'
            value={activationNote}
            placeholder={activationPlaceholder}
            placeholderClass='note-placeholder'
            onChange={setActivationNote}
            maxLength={2000}
            rows={Math.max(3, activationNote.split('\n').length + 1)}
          />
        </View>

        {/* 2. 选{体式/动作/泳姿} · 品类联动 · tap 打开全屏 sheet 多选 */}
        <View className='pose-card'>
          <View className='pose-summary-row' onClick={openPosePicker}>
            <Text className='pose-summary-label'>选{poseNoun}</Text>
            <View className='pose-summary-value'>
              {selectedNamesForDisplay.length === 0 ? (
                <Text className='pose-summary-name muted'>暂不选</Text>
              ) : (
                <Text className='pose-summary-name'>
                  {selectedNamesForDisplay.length <= 2
                    ? selectedNamesForDisplay.join(' · ')
                    : `${selectedNamesForDisplay.slice(0, 2).join(' · ')} · +${selectedNamesForDisplay.length - 2}`}
                </Text>
              )}
              <Text className='pose-summary-caret'>›</Text>
            </View>
          </View>
        </View>

        {/* 3. 感受与身体 · 合卡 (SensationPicker bare + 身体图入口) */}
        <View className='sense-body-card'>
          <SensationPicker bare value={sensation} onChange={setSensation} />
          <View className='card-inner-divider' />
          <View className='body-entry-row' onClick={() => setBodyOpen(true)}>
            <View className='thumb'>
              <BodyFigure view='front' mode='readonly' annotations={annotations} size={44} />
            </View>
            <View className='label-block'>
              <Text className='label-title'>身体今天哪里被唤醒了</Text>
              <Text className='label-sub'>{bodyEntryLabel}</Text>
            </View>
            <Text className='caret'>›</Text>
          </View>
        </View>

        {/* 4. 更多字段 · 平铺占位 (Sprint 3+ 实现) */}
        <View className='more-fields-flat'>
          <View className='more-pair-row'>
            <View className='more-pair-cell' onClick={() => notReadyToast('时长 · 未实现')}>
              <Text>＋ 时长</Text>
            </View>
            <View className='more-pair-cell' onClick={() => notReadyToast('语音 · 未实现')}>
              <Text>＋ 语音</Text>
            </View>
          </View>
          <View className='photo-slot' onClick={() => notReadyToast('照片上传 · 未实现')}>
            <Text className='photo-slot-hint'>拍下你的手账 / 场地 / 镜子自拍</Text>
          </View>
        </View>
      </View>

      {/* ─── Fixed bottom "记下了" ─── */}
      <View className='submit-bar'>
        <View
          className={`submit-cta ${hasContent && !submitting ? 'active' : ''}`}
          onClick={hasContent && !submitting ? handleSubmit : undefined}
        >
          <Text className='submit-label'>
            {submitting
              ? (isEditing ? '正在保存...' : '正在合上本子...')
              : (isEditing ? '保存修改' : '记下了')}
          </Text>
        </View>
      </View>

      {/* BodyMap overlay */}
      <BodyMapOverlay
        open={bodyOpen}
        annotations={annotations}
        onAnnotationsChange={setAnnotations}
        onClose={() => setBodyOpen(false)}
        availablePoses={availablePosesForBody}
        annotationPoseIds={annotationPoseIds}
        onAnnotationPoseIdsChange={setAnnotationPoseIds}
      />

      {/* Pose picker sheet · 全屏多选 */}
      <PosePickerSheet
        key={pickerRerenderKey}
        open={posePickerOpen}
        activityType={activityType}
        selectedPoseIds={selectedPoseIds}
        selectedCustomNames={selectedCustomNames}
        onDone={handlePickerDone}
        onClose={() => setPosePickerOpen(false)}
        onGoAddCustom={() => Taro.navigateTo({ url: `/pages/pose-add/index?activity=${activityType}` })}
      />

      {/* 首次进 record 的 onboarding tip */}
      {showRecordTip && !closing && (
        <OnboardingTipModal
          tip={ONBOARDING_TIPS.record}
          onDismiss={() => markOnboardingSeen('record')}
        />
      )}

      {/* 合上本子 · 提交成功后的 1.5s 动效 */}
      {closing && (
        <View className='close-book-overlay'>
          <View className='close-book-content'>
            <View className='close-book-icon-wrap'>
              <IconCloseBook size={44} color='var(--color-green-text)' />
            </View>
            <View className='close-book-text-wrap'>
              <Text className='close-book-title'>记下了。</Text>
              <Text className='close-book-subtitle'>合上本子，明天见。</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
