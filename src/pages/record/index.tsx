import { useState, useCallback, useMemo } from 'react'
import { View, Text, Input, Textarea, Slider, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useDiaryStore, useAuthStore } from '@/store'
import {
  ACTIVITY_TYPE_LABELS,
  FEELING_EMOJIS,
  FEELING_LABELS,
  ACTIVITY_BODY_MAP,
} from '@/utils/constants'
import { SENSATION_LABELS, SENSATION_COLORS, SensationType, BODY_PART_LABELS } from '@/types/body'
import type { ActivityType, CreateAnnotationInput } from '@/types'
import './index.scss'

const ACTIVITY_TYPES = Object.entries(ACTIVITY_TYPE_LABELS) as [ActivityType, string][]

// 「如何找到感觉」预设引导
const HOW_TO_FEEL_HINTS = [
  '触摸该部位感受温度变化',
  '做一个小幅度收缩动作',
  '专注呼吸，感受随呼吸的起伏',
  '轻柔按压，感受反馈',
  '放慢动作，感受每一寸移动',
]

// 感受快捷词
const SENSATION_QUICK_PICKS: SensationType[] = [
  SensationType.Soreness,
  SensationType.Pump,
  SensationType.Warmth,
  SensationType.Tightness,
  SensationType.Strength,
  SensationType.Relaxation,
  SensationType.Fatigue,
  SensationType.Stretch,
  SensationType.Pain,
]

type PartState = {
  hasSensation: boolean  // 用户是否有感受
  sensation: SensationType
  intensity: number      // 1-5
  note: string
  howToFeel: string
}

export default function Record() {
  const { createEntry } = useDiaryStore()
  const { profile } = useAuthStore()

  // ---- 基础信息 ----
  const [activityType, setActivityType] = useState<ActivityType>('strength')
  const [activityName, setActivityName] = useState('')
  const [duration, setDuration] = useState(45)
  const [calories, setCalories] = useState('')
  const [feeling, setFeeling] = useState(3)
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // ---- 推荐部位状态 ----
  const recommendedParts = useMemo(() => ACTIVITY_BODY_MAP[activityType] || [], [activityType])

  // 每个部位的感受状态，key = body_part string
  const [partStates, setPartStates] = useState<Record<string, PartState>>({})
  // 展开哪个部位的详情面板
  const [expandedPart, setExpandedPart] = useState<string | null>(null)

  const getPartState = useCallback((part: string): PartState => {
    return partStates[part] || {
      hasSensation: false,
      sensation: SensationType.Soreness,
      intensity: 3,
      note: '',
      howToFeel: '',
    }
  }, [partStates])

  const updatePartState = useCallback((part: string, patch: Partial<PartState>) => {
    setPartStates(prev => ({
      ...prev,
      [part]: { ...getPartState(part), ...patch }
    }))
  }, [getPartState])

  // 切换「有感受」
  const toggleHasSensation = useCallback((part: string) => {
    const current = getPartState(part)
    const next = !current.hasSensation
    updatePartState(part, { hasSensation: next })
    setExpandedPart(next ? part : (expandedPart === part ? null : expandedPart))
  }, [getPartState, updatePartState, expandedPart])

  const toggleTag = useCallback((tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }, [])

  const handleBack = useCallback(() => {
    Taro.showModal({
      title: '放弃记录？',
      content: '内容将不会保存',
      confirmText: '放弃',
      cancelText: '继续',
      confirmColor: '#B85450',
      success: (res) => { if (res.confirm) Taro.navigateBack() },
    })
  }, [])

  const handleSave = useCallback(async () => {
    if (!profile?.id) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    // 自动生成标题
    const actLabel = ACTIVITY_TYPE_LABELS[activityType]
    const autoTitle = activityName.trim()
      ? `${actLabel} · ${activityName.trim()}`
      : `${actLabel} ${new Date().toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}`

    // 收集有感受的部位注释
    const annotations: CreateAnnotationInput[] = recommendedParts
      .filter(rp => getPartState(rp.part).hasSensation)
      .map(rp => {
        const s = getPartState(rp.part)
        return {
          body_part: rp.part,
          sensation: s.sensation,
          intensity: s.intensity,
          note: [s.note, s.howToFeel ? `找到感觉：${s.howToFeel}` : ''].filter(Boolean).join('\n') || undefined,
        }
      })

    setSaving(true)
    try {
      await createEntry(
        {
          user_id: profile.id,
          title: autoTitle,
          content: content.trim() || undefined,
          activity_type: activityType,
          activity_name: activityName.trim() || undefined,
          duration_minutes: duration,
          calories: calories ? parseInt(calories) : undefined,
          overall_feeling: feeling,
          tags,
        },
        annotations
      )
      Taro.showToast({ title: '记录成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 500)
    } catch (err: any) {
      Taro.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }, [
    profile, activityType, activityName, duration, calories,
    feeling, content, tags, recommendedParts, getPartState, createEntry,
  ])

  const annotatedCount = recommendedParts.filter(rp => getPartState(rp.part).hasSensation).length

  return (
    <View className='record-page'>
      {/* ---- 固定头部 ---- */}
      <View className='record-page__header'>
        <View className='record-page__back-btn' onClick={handleBack}>
          <Text className='record-page__back-text'>✕ 放弃</Text>
        </View>
        <Text className='record-page__header-title'>记录感知</Text>
        <View style={{ width: '120px' }} />
      </View>

      <ScrollView scrollY className='record-page__scroll'>

        {/* ====== 区块 1：运动类型 ====== */}
        <View className='record-page__block'>
          <Text className='record-page__block-label'>这次做了什么？</Text>
          <View className='record-page__type-grid'>
            {ACTIVITY_TYPES.map(([type, label]) => (
              <View
                key={type}
                className={`record-page__type-chip ${activityType === type ? 'record-page__type-chip--active' : ''}`}
                onClick={() => {
                  setActivityType(type)
                  setPartStates({})   // 切换运动类型时清空部位状态
                  setExpandedPart(null)
                }}
              >
                <Text className='record-page__type-chip-text'>{label}</Text>
              </View>
            ))}
          </View>

          <Input
            className='record-page__input'
            placeholder='具体动作或课程名（选填，如：硬拉、热流瑜伽...）'
            value={activityName}
            onInput={(e) => setActivityName(e.detail.value)}
          />
        </View>

        {/* ====== 区块 2：时长 & 卡路里 ====== */}
        <View className='record-page__block'>
          <Text className='record-page__block-label'>时长与消耗</Text>
          <View className='record-page__row-stats'>
            <View className='record-page__stat-item'>
              <Text className='record-page__stat-value'>{duration}</Text>
              <Text className='record-page__stat-unit'>分钟</Text>
            </View>
            <View className='record-page__stat-divider' />
            <View className='record-page__stat-item record-page__stat-item--cal'>
              <Input
                className='record-page__cal-input'
                placeholder='卡路里（选填）'
                value={calories}
                type='number'
                onInput={(e) => setCalories(e.detail.value)}
              />
              <Text className='record-page__stat-unit'>kcal</Text>
            </View>
          </View>
          <Slider
            min={5} max={240} step={5} value={duration}
            activeColor='var(--color-accent)'
            onChange={(e) => setDuration(e.detail.value)}
            className='record-page__slider'
          />
        </View>

        {/* ====== 区块 3：身体感知 ====== */}
        <View className='record-page__block'>
          <View className='record-page__block-header'>
            <Text className='record-page__block-label'>身体告诉你什么了？</Text>
            {annotatedCount > 0 && (
              <Text className='record-page__block-badge'>{annotatedCount} 处有感受</Text>
            )}
          </View>
          <Text className='record-page__block-hint'>
            根据「{ACTIVITY_TYPE_LABELS[activityType]}」，这些部位可能参与了这次运动——
          </Text>

          {recommendedParts.map((rp) => {
            const ps = getPartState(rp.part)
            const isExpanded = expandedPart === rp.part
            return (
              <View key={rp.part} className={`record-page__part-card ${ps.hasSensation ? 'record-page__part-card--felt' : ''}`}>
                {/* 部位行 */}
                <View className='record-page__part-row'>
                  <View className='record-page__part-left'>
                    <Text className='record-page__part-name'>{BODY_PART_LABELS[rp.part]}</Text>
                    <Text className='record-page__part-hint'>{rp.hint}</Text>
                  </View>
                  <View className='record-page__part-right'>
                    {ps.hasSensation && (
                      <View
                        className='record-page__part-expand-btn'
                        onClick={() => setExpandedPart(isExpanded ? null : rp.part)}
                      >
                        <Text className='record-page__part-expand-text'>
                          {isExpanded ? '收起' : '编辑'}
                        </Text>
                      </View>
                    )}
                    <View
                      className={`record-page__part-toggle ${ps.hasSensation ? 'record-page__part-toggle--on' : ''}`}
                      onClick={() => toggleHasSensation(rp.part)}
                    >
                      <Text className='record-page__part-toggle-text'>
                        {ps.hasSensation ? '有感受' : '没感觉'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 展开详情 */}
                {ps.hasSensation && isExpanded && (
                  <View className='record-page__part-detail'>
                    {/* 快速选感受类型 */}
                    <Text className='record-page__detail-label'>感受是？</Text>
                    <View className='record-page__sensation-grid'>
                      {SENSATION_QUICK_PICKS.map((s) => (
                        <View
                          key={s}
                          className={`record-page__sensation-chip ${ps.sensation === s ? 'record-page__sensation-chip--active' : ''}`}
                          style={ps.sensation === s ? {
                            backgroundColor: SENSATION_COLORS[s] + '20',
                            borderColor: SENSATION_COLORS[s],
                          } : {}}
                          onClick={() => updatePartState(rp.part, { sensation: s })}
                        >
                          <View
                            className='record-page__sensation-dot'
                            style={{ backgroundColor: SENSATION_COLORS[s] }}
                          />
                          <Text className='record-page__sensation-text'>{SENSATION_LABELS[s]}</Text>
                        </View>
                      ))}
                    </View>

                    {/* 强度 */}
                    <Text className='record-page__detail-label'>强度 {ps.intensity}/5</Text>
                    <Slider
                      min={1} max={5} step={1} value={ps.intensity}
                      activeColor={SENSATION_COLORS[ps.sensation]}
                      onChange={(e) => updatePartState(rp.part, { intensity: e.detail.value })}
                      className='record-page__slider'
                    />

                    {/* 如何找到感觉 */}
                    <Text className='record-page__detail-label'>你是怎么找到这个感觉的？（选填）</Text>
                    <View className='record-page__how-grid'>
                      {HOW_TO_FEEL_HINTS.map((hint) => (
                        <View
                          key={hint}
                          className={`record-page__how-chip ${ps.howToFeel === hint ? 'record-page__how-chip--active' : ''}`}
                          onClick={() => updatePartState(rp.part, {
                            howToFeel: ps.howToFeel === hint ? '' : hint
                          })}
                        >
                          <Text className='record-page__how-text'>{hint}</Text>
                        </View>
                      ))}
                    </View>

                    {/* 自由备注 */}
                    <Input
                      className='record-page__input record-page__input--sm'
                      placeholder='更多描述（选填）'
                      value={ps.note}
                      onInput={(e) => updatePartState(rp.part, { note: e.detail.value })}
                    />
                  </View>
                )}
              </View>
            )
          })}
        </View>

        {/* ====== 区块 4：整体感受 ====== */}
        <View className='record-page__block'>
          <Text className='record-page__block-label'>整体感觉怎么样？</Text>
          <View className='record-page__feeling-row'>
            {[1, 2, 3, 4, 5].map((f) => (
              <View
                key={f}
                className={`record-page__feeling-item ${feeling === f ? 'record-page__feeling-item--active' : ''}`}
                onClick={() => setFeeling(f)}
              >
                <Text className='record-page__feeling-emoji'>{FEELING_EMOJIS[f]}</Text>
                <Text className='record-page__feeling-text'>{FEELING_LABELS[f]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ====== 区块 5：日记 ====== */}
        <View className='record-page__block'>
          <Text className='record-page__block-label'>还有什么想记录的？（选填）</Text>
          <Textarea
            className='record-page__textarea'
            placeholder='心流体验、突破、当下的身体状态、脑中的想法...'
            value={content}
            onInput={(e) => setContent(e.detail.value)}
            maxlength={5000}
            autoHeight
          />

          {/* 标签 */}
          <View className='record-page__tags'>
            {['发力感', '突破', '心流', '专注', '放松', '酸爽', '拉伸感', '疲惫'].map((tag) => (
              <View
                key={tag}
                className={`record-page__tag ${tags.includes(tag) ? 'record-page__tag--active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                <Text className='record-page__tag-text'>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 底部留白 */}
        <View style={{ height: '160px' }} />
      </ScrollView>

      {/* ---- 底部保存按钮 ---- */}
      <View className='record-page__footer'>
        <View
          className={`record-page__save-btn ${saving ? 'record-page__save-btn--disabled' : ''}`}
          onClick={saving ? undefined : handleSave}
        >
          <Text className='record-page__save-text'>{saving ? '保存中...' : '完成记录'}</Text>
        </View>
      </View>
    </View>
  )
}
