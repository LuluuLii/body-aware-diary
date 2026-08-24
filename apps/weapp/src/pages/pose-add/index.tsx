// Sprint 2.7-B · 添加自定义 pose 表单页
// URL: /pages/pose-add/index[?activity=ballet]
//
// 场景 · 用户在图鉴或 record 页 PosePickerSheet 里 tap "找不到？添加自定义" 进入。
// 提交后 addUserPoseLocal 立即写入 Zustand 缓存，navigateBack 后 picker/图鉴 立刻能看到新 pose。
// 图片上传 Sprint 3 才做，本页图片槽位是 disabled placeholder。

import { useMemo, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import {
  createUserPose,
  ensureProfile,
  type ActivityType,
  type UserPoseDraft,
} from '@body-diary/core'
import { MUSCLES, POSE_FAMILIES, POSES, type PoseFamily } from '@body-diary/content'
import { IconArrowLeft } from '../../lib/icons'
import { getSupabase, ensureAnonymousSession } from '../../lib/supabase'
import { useAppStore } from '../../store/useAppStore'
import { AutoTextarea } from '../../components/AutoTextarea'
import {
  ACTIVITY_TYPE_LABELS,
  POSE_NOUN_BY_ACTIVITY,
} from '../../lib/format'
import './index.scss'

const ACTIVITY_CHOICES: readonly ActivityType[] = [
  'yoga_mat', 'ballet', 'swimming', 'strength', 'other',
]

export default function PoseAdd() {
  const router = useRouter()
  const activityHint = (router.params?.activity as ActivityType | undefined)
  const addUserPoseLocal = useAppStore((s) => s.addUserPoseLocal)

  // Form state
  const [activityType, setActivityType] = useState<ActivityType>(activityHint ?? 'yoga_mat')
  const [family, setFamily] = useState<PoseFamily | null>(null)
  const [nameZh, setNameZh] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [selectedMuscleIds, setSelectedMuscleIds] = useState<string[]>([])
  const [activationCue, setActivationCue] = useState('')
  const [compensation, setCompensation] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 依 activity 显示可选 family（复用内置库里该 activity 已有的 family）
  const familyChoices = useMemo(() => {
    const set = new Set<PoseFamily>()
    POSES.filter((p) => p.activityType === activityType).forEach((p) => set.add(p.family))
    return POSE_FAMILIES.filter((f) => set.has(f))
  }, [activityType])

  const poseNoun = POSE_NOUN_BY_ACTIVITY[activityType]

  const handleActivityChange = (next: ActivityType) => {
    if (next === activityType) return
    setActivityType(next)
    setFamily(null) // 品类变了 family 语义不同，reset
  }

  const toggleMuscle = (id: string) => {
    setSelectedMuscleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const canSubmit = nameZh.trim().length > 0 && !submitting

  const goBack = () => {
    const pages = Taro.getCurrentPages()
    if (pages.length > 1) Taro.navigateBack()
    else Taro.reLaunch({ url: '/pages/poses/index' })
  }

  const notReadyToast = (msg: string) =>
    Taro.showToast({ title: msg, icon: 'none', duration: 1600 })

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const session = await ensureAnonymousSession()
      if (!session) throw new Error('No session')
      const client = getSupabase()
      await ensureProfile(client, session.user.id)

      const draft: UserPoseDraft = {
        activity_type: activityType,
        family: family,
        name_zh: nameZh.trim(),
        name_en: nameEn.trim() || null,
        main_muscle_ids: selectedMuscleIds,
        activation_cue: activationCue.trim() || null,
        compensation: compensation.trim() || null,
        sensation_words: [],
        image_url: null,
      }
      const created = await createUserPose(client, session.user.id, draft)
      addUserPoseLocal(created)

      Taro.showToast({ title: '已加入你的图鉴', icon: 'success', duration: 1400 })
      setTimeout(() => goBack(), 800)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[pose-add]', err)
      const msg = err instanceof Error ? err.message : '保存失败'
      Taro.showToast({ title: `没能保存下来 · ${msg}`, icon: 'none', duration: 2200 })
      setSubmitting(false)
    }
  }

  return (
    <View className='pose-add-page paper-grid-bg'>
      <View className='pa-scroll'>
        {/* Top bar */}
        <View className='top-bar'>
          <View className='back-btn' onClick={goBack}>
            <IconArrowLeft size={17} color='var(--color-text-secondary)' />
          </View>
        </View>

        <Text className='page-title'>添加一个{poseNoun}</Text>
        <Text className='page-sub'>写下你练习中做的{poseNoun}，之后记录时就能选它了。</Text>

        {/* 品类 */}
        <View className='field-block'>
          <Text className='field-label'>品类 <Text className='required'>*</Text></Text>
          <View className='chip-row'>
            {ACTIVITY_CHOICES.map((a) => (
              <Text
                key={a}
                className={`chip ${activityType === a ? 'active' : ''}`}
                onClick={() => handleActivityChange(a)}
              >{ACTIVITY_TYPE_LABELS[a]}</Text>
            ))}
          </View>
        </View>

        {/* Family (可选，依 activity 联动) */}
        {familyChoices.length > 0 && (
          <View className='field-block'>
            <Text className='field-label'>分类 <Text className='field-hint'>(可选)</Text></Text>
            <View className='chip-row'>
              {familyChoices.map((f) => (
                <Text
                  key={f}
                  className={`chip ${family === f ? 'active' : ''}`}
                  onClick={() => setFamily(family === f ? null : f)}
                >{f}</Text>
              ))}
            </View>
          </View>
        )}

        {/* 名称 */}
        <View className='field-block'>
          <Text className='field-label'>名称 <Text className='required'>*</Text></Text>
          <Input
            className='text-input'
            value={nameZh}
            placeholder={`这个${poseNoun}你想怎么叫？`}
            onInput={(e: any) => setNameZh(e?.detail?.value ?? '')}
            maxlength={40}
          />
        </View>

        {/* 英文名 (可选) */}
        <View className='field-block'>
          <Text className='field-label'>英文/原文名 <Text className='field-hint'>(可选)</Text></Text>
          <Input
            className='text-input'
            value={nameEn}
            placeholder='e.g. Plié / Downward Dog'
            onInput={(e: any) => setNameEn(e?.detail?.value ?? '')}
            maxlength={60}
          />
        </View>

        {/* 主要激活肌肉 */}
        <View className='field-block'>
          <Text className='field-label'>主要激活肌肉 <Text className='field-hint'>(选几个，可空)</Text></Text>
          <View className='muscle-chip-row'>
            {MUSCLES.map((m) => (
              <Text
                key={m.groupId}
                className={`muscle-chip ${selectedMuscleIds.includes(m.groupId) ? 'active' : ''}`}
                onClick={() => toggleMuscle(m.groupId)}
              >{m.nameZh}</Text>
            ))}
          </View>
        </View>

        {/* 发力感线索 */}
        <View className='field-block'>
          <Text className='field-label'>发力感线索 <Text className='field-hint'>(可选)</Text></Text>
          <AutoTextarea
            className='text-area'
            value={activationCue}
            placeholder='e.g. 脚跟压地，尾骨微收，胸腔延展向上。'
            onChange={setActivationCue}
            maxLength={400}
            rows={3}
          />
        </View>

        {/* 常见代偿 */}
        <View className='field-block'>
          <Text className='field-label'>常见代偿 <Text className='field-hint'>(可选)</Text></Text>
          <AutoTextarea
            className='text-area'
            value={compensation}
            placeholder='e.g. 用腰去发力而不是臀；膝盖内扣。'
            onChange={setCompensation}
            maxLength={400}
            rows={2}
          />
        </View>

        {/* 图片槽位 (Sprint 3 会做上传) */}
        <View className='field-block'>
          <Text className='field-label'>参考图片 <Text className='field-hint'>(Sprint 3 支持上传)</Text></Text>
          <View className='photo-slot-disabled' onClick={() => notReadyToast('图片上传 · Sprint 3 会做')}>
            <Text className='photo-slot-hint'>＋ 图片上传 · 待实现</Text>
          </View>
        </View>
      </View>

      {/* Fixed bottom submit */}
      <View className='submit-bar'>
        <View
          className={`submit-cta ${canSubmit ? 'active' : ''}`}
          onClick={canSubmit ? handleSubmit : undefined}
        >
          <Text className='submit-label'>
            {submitting ? '正在加入图鉴...' : '创建'}
          </Text>
        </View>
      </View>
    </View>
  )
}
