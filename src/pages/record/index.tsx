import { useState, useCallback } from 'react'
import { View, Text, Input, Textarea, Slider } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useDiaryStore, useAuthStore } from '@/store'
import TagSelector from '@/components/TagSelector'
import SensationPicker from '@/components/SensationPicker'
import { ACTIVITY_TYPE_LABELS, FEELING_EMOJIS, FEELING_LABELS } from '@/utils/constants'
import { BODY_PART_GROUPS, BODY_PART_LABELS, SensationType } from '@/types/body'
import type { ActivityType, CreateAnnotationInput } from '@/types'
import type { BodyPart } from '@/types/body'
import './index.scss'

const ACTIVITY_TYPES = Object.entries(ACTIVITY_TYPE_LABELS) as [ActivityType, string][]

export default function Record() {
  const [step, setStep] = useState(0)
  const { createEntry } = useDiaryStore()
  const { profile } = useAuthStore()

  // Step 1: Activity info
  const [activityType, setActivityType] = useState<ActivityType>('other')
  const [activityName, setActivityName] = useState('')
  const [duration, setDuration] = useState(30)
  const [intensity, setIntensity] = useState(5)

  // Step 2: Body annotations
  const [annotations, setAnnotations] = useState<CreateAnnotationInput[]>([])
  const [selectedPart, setSelectedPart] = useState<BodyPart | null>(null)
  const [currentSensation, setCurrentSensation] = useState<SensationType>(SensationType.Soreness)
  const [currentIntensity, setCurrentIntensity] = useState(3)
  const [currentNote, setCurrentNote] = useState('')

  // Step 3: Diary content
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [feeling, setFeeling] = useState(3)
  const [tags, setTags] = useState<string[]>([])

  const [saving, setSaving] = useState(false)

  const addAnnotation = useCallback(() => {
    if (!selectedPart) return
    const existing = annotations.findIndex((a) => a.body_part === selectedPart)
    const newAnn: CreateAnnotationInput = {
      body_part: selectedPart,
      sensation: currentSensation,
      intensity: currentIntensity,
      note: currentNote || undefined,
    }
    if (existing >= 0) {
      setAnnotations(annotations.map((a, i) => (i === existing ? newAnn : a)))
    } else {
      setAnnotations([...annotations, newAnn])
    }
    setSelectedPart(null)
    setCurrentNote('')
  }, [selectedPart, currentSensation, currentIntensity, currentNote, annotations])

  const removeAnnotation = useCallback((part: BodyPart) => {
    setAnnotations(annotations.filter((a) => a.body_part !== part))
  }, [annotations])

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入标题', icon: 'none' })
      return
    }
    if (!profile?.id) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    setSaving(true)
    try {
      await createEntry(
        {
          user_id: profile.id,
          title: title.trim(),
          content: content.trim() || undefined,
          activity_type: activityType,
          activity_name: activityName.trim() || undefined,
          duration_minutes: duration,
          intensity,
          overall_feeling: feeling,
          tags,
        },
        annotations
      )
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 500)
    } catch (err: any) {
      Taro.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }, [title, content, activityType, activityName, duration, intensity, feeling, tags, annotations, profile, createEntry])

  return (
    <View className='record-page'>
      {/* Step indicator */}
      <View className='record-page__steps'>
        {['活动', '身体', '日记'].map((label, i) => (
          <View
            key={label}
            className={`record-page__step ${step === i ? 'record-page__step--active' : ''} ${i < step ? 'record-page__step--done' : ''}`}
            onClick={() => setStep(i)}
          >
            <Text className='record-page__step-text'>{label}</Text>
          </View>
        ))}
      </View>

      {/* Step 1: Activity */}
      {step === 0 && (
        <View className='record-page__section'>
          <Text className='record-page__label'>活动类型</Text>
          <View className='record-page__type-grid'>
            {ACTIVITY_TYPES.map(([type, label]) => (
              <View
                key={type}
                className={`record-page__type-item ${activityType === type ? 'record-page__type-item--active' : ''}`}
                onClick={() => setActivityType(type)}
              >
                <Text className='record-page__type-text'>{label}</Text>
              </View>
            ))}
          </View>

          <Text className='record-page__label'>活动名称（选填）</Text>
          <Input
            className='record-page__input'
            placeholder='如：背部划船、热瑜伽...'
            value={activityName}
            onInput={(e) => setActivityName(e.detail.value)}
          />

          <Text className='record-page__label'>时长: {duration}分钟</Text>
          <Slider min={5} max={180} step={5} value={duration} activeColor='#4F46E5'
            onChange={(e) => setDuration(e.detail.value)} />

          <Text className='record-page__label'>强度(RPE): {intensity}/10</Text>
          <Slider min={1} max={10} step={1} value={intensity} activeColor='#4F46E5'
            onChange={(e) => setIntensity(e.detail.value)} />
        </View>
      )}

      {/* Step 2: Body Annotations */}
      {step === 1 && (
        <View className='record-page__section'>
          <Text className='record-page__label'>选择身体部位</Text>
          {BODY_PART_GROUPS.map((group) => (
            <View key={group.label} className='record-page__body-group'>
              <Text className='record-page__group-label'>{group.label}</Text>
              <View className='record-page__body-parts'>
                {group.parts.map((part) => {
                  const ann = annotations.find((a) => a.body_part === part)
                  return (
                    <View
                      key={part}
                      className={`record-page__part-btn ${selectedPart === part ? 'record-page__part-btn--selected' : ''} ${ann ? 'record-page__part-btn--annotated' : ''}`}
                      onClick={() => setSelectedPart(selectedPart === part ? null : part)}
                    >
                      <Text className='record-page__part-text'>{BODY_PART_LABELS[part]}</Text>
                      {ann && <Text className='record-page__part-badge'>✓</Text>}
                    </View>
                  )
                })}
              </View>
            </View>
          ))}

          {selectedPart && (
            <View className='record-page__annotation-form'>
              <Text className='record-page__label'>
                标注「{BODY_PART_LABELS[selectedPart]}」的感知
              </Text>
              <SensationPicker
                sensation={currentSensation}
                intensity={currentIntensity}
                onSensationChange={setCurrentSensation}
                onIntensityChange={setCurrentIntensity}
              />
              <Input
                className='record-page__input'
                placeholder='备注（选填）'
                value={currentNote}
                onInput={(e) => setCurrentNote(e.detail.value)}
              />
              <View className='record-page__ann-actions'>
                <View className='record-page__btn record-page__btn--primary' onClick={addAnnotation}>
                  <Text className='record-page__btn-text'>确认标注</Text>
                </View>
              </View>
            </View>
          )}

          {annotations.length > 0 && (
            <View className='record-page__ann-list'>
              <Text className='record-page__label'>已标注 ({annotations.length})</Text>
              {annotations.map((a) => (
                <View key={a.body_part} className='record-page__ann-item'>
                  <Text className='record-page__ann-name'>{BODY_PART_LABELS[a.body_part]}</Text>
                  <Text className='record-page__ann-detail'>
                    {a.sensation} · 强度{a.intensity}
                  </Text>
                  <Text
                    className='record-page__ann-remove'
                    onClick={() => removeAnnotation(a.body_part)}
                  >✕</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Step 3: Diary Content */}
      {step === 2 && (
        <View className='record-page__section'>
          <Text className='record-page__label'>标题 *</Text>
          <Input
            className='record-page__input'
            placeholder='给这次训练起个标题'
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
          />

          <Text className='record-page__label'>心得体会</Text>
          <Textarea
            className='record-page__textarea'
            placeholder='记录你的身体感受、发力感觉、心流体验...'
            value={content}
            onInput={(e) => setContent(e.detail.value)}
            maxlength={5000}
            autoHeight
          />

          <Text className='record-page__label'>整体感受</Text>
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

          <Text className='record-page__label'>标签</Text>
          <TagSelector
            tags={['发力', '拉伸', '突破', '酸爽', '心流', '专注', '放松']}
            selected={tags}
            onChange={setTags}
            allowCustom
          />
        </View>
      )}

      {/* Navigation buttons */}
      <View className='record-page__nav'>
        {step > 0 && (
          <View className='record-page__btn record-page__btn--outline' onClick={() => setStep(step - 1)}>
            <Text className='record-page__btn-text record-page__btn-text--outline'>上一步</Text>
          </View>
        )}
        {step < 2 ? (
          <View className='record-page__btn record-page__btn--primary' onClick={() => setStep(step + 1)}>
            <Text className='record-page__btn-text'>下一步</Text>
          </View>
        ) : (
          <View
            className={`record-page__btn record-page__btn--primary ${saving ? 'record-page__btn--disabled' : ''}`}
            onClick={saving ? undefined : handleSave}
          >
            <Text className='record-page__btn-text'>{saving ? '保存中...' : '保存日记'}</Text>
          </View>
        )}
      </View>
    </View>
  )
}
