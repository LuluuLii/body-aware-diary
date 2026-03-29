import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, Slider, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useDiaryStore, useAuthStore } from '@/store'
import {
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_BODY_MAP,
} from '@/utils/constants'
import { SENSATION_LABELS, SENSATION_COLORS, SensationType, BODY_PART_LABELS } from '@/types/body'
import type { CreateAnnotationInput } from '@/types'
import './index.scss'

// 仅显示酸痛相关感受类型，适合「延迟性酸痛」场景
const SORENESS_SENSATIONS: SensationType[] = [
  SensationType.Soreness,
  SensationType.Tightness,
  SensationType.Pain,
  SensationType.Fatigue,
  SensationType.Stretch,
]

type PartState = {
  checked: boolean
  sensation: SensationType
  intensity: number
}

export default function SorenessPatch() {
  const router = useRouter()
  const entryId = router.params.entryId as string

  const { getEntry, currentEntry, appendSorenessAnnotations, clearCurrent } = useDiaryStore()
  const { profile } = useAuthStore()
  const [partStates, setPartStates] = useState<Record<string, PartState>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (entryId) getEntry(entryId)
    return () => clearCurrent()
  }, [entryId])

  const recommendedParts = useMemo(
    () => (currentEntry ? (ACTIVITY_BODY_MAP[currentEntry.activity_type] || []) : []),
    [currentEntry]
  )

  const getPartState = useCallback((part: string): PartState => {
    return partStates[part] || {
      checked: false,
      sensation: SensationType.Soreness,
      intensity: 3,
    }
  }, [partStates])

  const togglePart = useCallback((part: string) => {
    const current = getPartState(part)
    setPartStates(prev => ({
      ...prev,
      [part]: { ...current, checked: !current.checked },
    }))
  }, [getPartState])

  const updatePart = useCallback((part: string, patch: Partial<PartState>) => {
    setPartStates(prev => ({
      ...prev,
      [part]: { ...getPartState(part), ...patch },
    }))
  }, [getPartState])

  const checkedCount = recommendedParts.filter(rp => getPartState(rp.part).checked).length

  const handleBack = useCallback(() => {
    Taro.navigateBack()
  }, [])

  const handleSave = useCallback(async () => {
    if (!currentEntry || !profile?.id) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (checkedCount === 0) {
      Taro.showToast({ title: '请先选择有酸痛感的部位', icon: 'none' })
      return
    }

    const annotations: CreateAnnotationInput[] = recommendedParts
      .filter(rp => getPartState(rp.part).checked)
      .map(rp => {
        const s = getPartState(rp.part)
        return {
          body_part: rp.part,
          sensation: s.sensation,
          intensity: s.intensity,
          note: '延迟酸痛补录',
          soreness_recorded_at: new Date().toISOString(),
        }
      })

    setSaving(true)
    try {
      await appendSorenessAnnotations(currentEntry.id, profile.id, annotations)
      Taro.showToast({ title: '补录成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 500)
    } catch (err: any) {
      Taro.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }, [currentEntry, profile, recommendedParts, getPartState, checkedCount, appendSorenessAnnotations])

  if (!currentEntry) {
    return (
      <View className='soreness-page'>
        <View className='soreness-page__loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='soreness-page'>
      {/* 固定头部 */}
      <View className='soreness-page__header'>
        <View className='soreness-page__back-btn' onClick={handleBack}>
          <Text className='soreness-page__back-text'>← 返回</Text>
        </View>
        <Text className='soreness-page__header-title'>酸痛补录</Text>
        <View style={{ width: '120px' }} />
      </View>

      <ScrollView scrollY className='soreness-page__scroll'>
        {/* 来源条目信息 */}
        <View className='soreness-page__origin'>
          <Text className='soreness-page__origin-label'>
            {ACTIVITY_TYPE_LABELS[currentEntry.activity_type]}
          </Text>
          <Text className='soreness-page__origin-title'>{currentEntry.title}</Text>
          <Text className='soreness-page__origin-hint'>
            运动结束后，身体有时会在 24–72 小时内出现「延迟性酸痛（DOMS）」。{'\n'}
            选择现在有酸痛感的部位，记录下来。
          </Text>
        </View>

        {/* 部位选择 */}
        <View className='soreness-page__block'>
          <View className='soreness-page__block-header'>
            <Text className='soreness-page__block-label'>哪里酸了？</Text>
            {checkedCount > 0 && (
              <Text className='soreness-page__block-badge'>{checkedCount} 处</Text>
            )}
          </View>

          {recommendedParts.map((rp) => {
            const ps = getPartState(rp.part)
            return (
              <View
                key={rp.part}
                className={`soreness-page__part-card ${ps.checked ? 'soreness-page__part-card--checked' : ''}`}
              >
                {/* 部位行 */}
                <View className='soreness-page__part-row' onClick={() => togglePart(rp.part)}>
                  <View className='soreness-page__part-left'>
                    <Text className='soreness-page__part-name'>{BODY_PART_LABELS[rp.part]}</Text>
                    <Text className='soreness-page__part-hint'>{rp.hint}</Text>
                  </View>
                  <View className={`soreness-page__part-check ${ps.checked ? 'soreness-page__part-check--on' : ''}`}>
                    <Text className='soreness-page__part-check-text'>{ps.checked ? '✓' : ''}</Text>
                  </View>
                </View>

                {/* 展开：感受类型 + 强度 */}
                {ps.checked && (
                  <View className='soreness-page__part-detail'>
                    <Text className='soreness-page__detail-label'>感受类型</Text>
                    <View className='soreness-page__sensation-row'>
                      {SORENESS_SENSATIONS.map((s) => (
                        <View
                          key={s}
                          className={`soreness-page__sensation-chip ${ps.sensation === s ? 'soreness-page__sensation-chip--active' : ''}`}
                          style={ps.sensation === s ? {
                            backgroundColor: SENSATION_COLORS[s] + '22',
                            borderColor: SENSATION_COLORS[s],
                          } : {}}
                          onClick={() => updatePart(rp.part, { sensation: s })}
                        >
                          <View
                            className='soreness-page__sensation-dot'
                            style={{ backgroundColor: SENSATION_COLORS[s] }}
                          />
                          <Text className='soreness-page__sensation-text'>{SENSATION_LABELS[s]}</Text>
                        </View>
                      ))}
                    </View>

                    <Text className='soreness-page__detail-label'>强度 {ps.intensity}/5</Text>
                    <Slider
                      min={1} max={5} step={1} value={ps.intensity}
                      activeColor={SENSATION_COLORS[ps.sensation]}
                      onChange={(e) => updatePart(rp.part, { intensity: e.detail.value })}
                      className='soreness-page__slider'
                    />
                  </View>
                )}
              </View>
            )
          })}
        </View>

        {/* 底部留白 */}
        <View style={{ height: '160px' }} />
      </ScrollView>

      {/* 底部保存 */}
      <View className='soreness-page__footer'>
        <View
          className={`soreness-page__save-btn ${(saving || checkedCount === 0) ? 'soreness-page__save-btn--disabled' : ''}`}
          onClick={(saving || checkedCount === 0) ? undefined : handleSave}
        >
          <Text className='soreness-page__save-text'>
            {saving ? '保存中...' : checkedCount > 0 ? `补录 ${checkedCount} 处酸痛` : '请选择有感觉的部位'}
          </Text>
        </View>
      </View>
    </View>
  )
}
