// BodyMapOverlay · 从底部滑出的全屏身体图覆盖层
// 用途：record 页点"身体图入口卡"后弹出，让用户在完整 BodyFigure 上标注肌肉感受。
//
// 交互:
//   - 全屏 sheet (top: 52px) 覆盖 record 页
//   - 顶部标题 + 完成按钮
//   - 前视/后视 tab 切换
//   - 中间 BodyFigure edit 模式
//   - 点肌肉 → 底部弹出 SensationSheet（另一个组件）
//   - 首次点肌肉时先弹 onboarding tip，dismiss 后自动打开 SensationSheet
//   - 关闭 sheet 后回到父页面时保留当前 annotations

import { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { ONBOARDING_TIPS } from '@body-diary/content'
import type { BodyView, MuscleLayoutEntry } from '@body-diary/assets'
import type { MuscleSensationTag } from '@body-diary/core'
import { useAppStore } from '../../store/useAppStore'
import { BodyFigure } from '../BodyFigure'
import { SensationSheet, type PoseChipInfo } from '../SensationSheet'
import { OnboardingTipModal } from '../OnboardingTipModal'
import './index.scss'

export interface BodyMapOverlayProps {
  open: boolean
  annotations: Record<string, MuscleSensationTag>
  onAnnotationsChange: (next: Record<string, MuscleSensationTag>) => void
  onClose: () => void
  // ─── v2.7-A · 关联 pose 支持 (可选) ────────────────────
  /** 本次 practice 已选的候选 pose，从 record 页 selectedPoseIds 派生 */
  availablePoses?: readonly PoseChipInfo[]
  /** 肌肉 asset id → 关联到的 pose_id 或 null */
  annotationPoseIds?: Record<string, string | null>
  onAnnotationPoseIdsChange?: (next: Record<string, string | null>) => void
}

export function BodyMapOverlay({
  open,
  annotations,
  onAnnotationsChange,
  onClose,
  availablePoses,
  annotationPoseIds,
  onAnnotationPoseIdsChange,
}: BodyMapOverlayProps) {
  const [view, setView] = useState<BodyView>('front')
  const [pending, setPending] = useState<MuscleLayoutEntry | null>(null)
  const [tipPending, setTipPending] = useState<MuscleLayoutEntry | null>(null)

  const onboardingSeen = useAppStore((s) => s.onboardingSeen)
  const markOnboardingSeen = useAppStore((s) => s.markOnboardingSeen)

  if (!open) return null

  const handleMusclePress = (muscle: MuscleLayoutEntry) => {
    // 首次点肌肉：先弹 tip，dismiss 后自动打开 sensation sheet
    if (!onboardingSeen.includes('bodymap_annotate')) {
      setTipPending(muscle)
      return
    }
    setPending(muscle)
  }

  const dismissTip = () => {
    markOnboardingSeen('bodymap_annotate')
    const m = tipPending
    setTipPending(null)
    if (m) setPending(m)
  }

  const handlePick = (next: MuscleSensationTag | undefined) => {
    if (!pending) return
    const copy = { ...annotations }
    if (next === undefined) {
      delete copy[pending.id]
      // 移除肌肉时同步清 pose 关联
      if (annotationPoseIds && onAnnotationPoseIdsChange) {
        const poseCopy = { ...annotationPoseIds }
        delete poseCopy[pending.id]
        onAnnotationPoseIdsChange(poseCopy)
      }
    } else {
      copy[pending.id] = next
    }
    onAnnotationsChange(copy)
    // v2.7-A: 只有当没有 pose 关联行时才 auto-close
    // (有 pose 可选时保持 sheet 打开让用户可以关联)
    const hasPoseChoice = availablePoses && availablePoses.length > 0 && onAnnotationPoseIdsChange
    if (!hasPoseChoice || next === undefined) {
      setPending(null)
    }
  }

  const handlePickPose = (poseId: string | null) => {
    if (!pending || !annotationPoseIds || !onAnnotationPoseIdsChange) return
    const copy = { ...annotationPoseIds }
    if (poseId === null) delete copy[pending.id]
    else copy[pending.id] = poseId
    onAnnotationPoseIdsChange(copy)
  }

  const closePending = () => setPending(null)

  return (
    <View className='bodymap-overlay'>
      <View className='backdrop' onClick={onClose} />
      <ScrollView className='sheet' scrollY enhanced showScrollbar={false}>
        <View className='header'>
          <Text className='title'>身体今天哪里被唤醒了</Text>
          <Text className='done-btn' onClick={onClose}>完成</Text>
        </View>
        <View className='tab-row'>
          <Text
            className={`tab ${view === 'front' ? 'active' : ''}`}
            onClick={() => setView('front')}
          >
            前视
          </Text>
          <Text
            className={`tab ${view === 'back' ? 'active' : ''}`}
            onClick={() => setView('back')}
          >
            后视
          </Text>
        </View>
        <View className='figure-wrap'>
          <BodyFigure
            view={view}
            mode='edit'
            annotations={annotations}
            onMusclePress={handleMusclePress}
            size={220}
          />
        </View>
        <Text className='hint'>点一块肌肉，标下此刻的感受 · 可标多块</Text>
      </ScrollView>
      {pending && (
        <>
          <View className='pending-backdrop' onClick={closePending} />
          <SensationSheet
            muscle={pending}
            current={annotations[pending.id]}
            onPick={handlePick}
            onClose={closePending}
            availablePoses={availablePoses}
            currentPoseId={annotationPoseIds?.[pending.id] ?? null}
            onPickPose={onAnnotationPoseIdsChange ? handlePickPose : undefined}
          />
        </>
      )}
      {tipPending && (
        <OnboardingTipModal
          tip={ONBOARDING_TIPS.bodymap_annotate}
          onDismiss={dismissTip}
        />
      )}
    </View>
  )
}
