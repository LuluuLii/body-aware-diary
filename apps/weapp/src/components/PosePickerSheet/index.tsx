// Sprint 2.7-A · PosePickerSheet
// 全屏 modal 版的体式/动作选择器，支持多选 + 搜索 + family tab + 缩略图占位 + 自定义
//
// 用法：
//   <PosePickerSheet
//     open={open}
//     activityType='ballet'
//     selectedPoseIds={ids}
//     selectedCustomNames={names}
//     onDone={(ids, names) => { setIds(ids); setNames(names); setOpen(false) }}
//     onClose={() => setOpen(false)}
//     onGoAddCustom={() => Taro.navigateTo({ url: '/pages/pose-add/index' })}
//   />

import { useMemo, useState } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import {
  getPosesByActivityType,
  POSE_FAMILIES,
} from '@body-diary/content'
import type { ActivityType } from '@body-diary/core'
import { useAppStore } from '../../store/useAppStore'
import { POSE_NOUN_BY_ACTIVITY, ACTIVITY_TYPE_LABELS } from '../../lib/format'
import './index.scss'

// v2.7-B: 内置 pose + 用户自建 pose 统一展示所需的最小 shape
interface DisplayPose {
  id: string
  nameZh: string
  nameEn: string
  family: string      // 用户自建可能是 null → 用 '自定义' 兜底
  isUserPose: boolean
}

const CUSTOM_FAMILY = '自定义'

export interface PosePickerSheetProps {
  open: boolean
  activityType: ActivityType
  selectedPoseIds: readonly string[]
  selectedCustomNames: readonly string[]
  /** 点"完成"后回调 */
  onDone: (poseIds: string[], customNames: string[]) => void
  /** 点关闭 × 或按 ESC */
  onClose: () => void
  /** 底部"找不到？添加自定义" — 跳去 pose-add 页（Sprint 2.7-B 才做） */
  onGoAddCustom?: () => void
}

export function PosePickerSheet({
  open,
  activityType,
  selectedPoseIds,
  selectedCustomNames,
  onDone,
  onClose,
  onGoAddCustom,
}: PosePickerSheetProps) {
  const [search, setSearch] = useState('')
  const [family, setFamily] = useState<string>('全部')
  const [draftIds, setDraftIds] = useState<string[]>([...selectedPoseIds])
  const [draftCustoms, setDraftCustoms] = useState<string[]>([...selectedCustomNames])
  const [customInput, setCustomInput] = useState('')

  const poseNoun = POSE_NOUN_BY_ACTIVITY[activityType]
  const activityLabel = ACTIVITY_TYPE_LABELS[activityType]

  // v2.7-B: 拉用户自建 pose 从 Zustand 缓存（app.tsx mount 时已 loadUserPoses）
  const userPoses = useAppStore((s) => s.userPoses)

  const combinedPoses = useMemo<DisplayPose[]>(() => {
    const builtins = getPosesByActivityType(activityType).map<DisplayPose>((p) => ({
      id: p.id, nameZh: p.nameZh, nameEn: p.nameEn, family: p.family, isUserPose: false,
    }))
    const userAdapted = userPoses
      .filter((p) => p.activity_type === activityType)
      .map<DisplayPose>((p) => ({
        id: p.id,
        nameZh: p.name_zh,
        nameEn: p.name_en ?? '',
        family: p.family ?? CUSTOM_FAMILY,
        isUserPose: true,
      }))
    return [...builtins, ...userAdapted]
  }, [activityType, userPoses])

  const familiesInActivity = useMemo<string[]>(() => {
    const set = new Set<string>()
    combinedPoses.forEach((p) => set.add(p.family))
    // 内置 family 按 POSE_FAMILIES 顺序，"自定义" 放最后
    const ordered: string[] = POSE_FAMILIES.filter((f) => set.has(f))
    if (set.has(CUSTOM_FAMILY)) ordered.push(CUSTOM_FAMILY)
    return ordered
  }, [combinedPoses])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = combinedPoses
    if (family !== '全部') list = list.filter((p) => p.family === family)
    if (q) {
      list = list.filter((p) =>
        p.nameZh.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q),
      )
    }
    return list
  }, [combinedPoses, family, search])

  const togglePose = (poseId: string) => {
    setDraftIds((prev) =>
      prev.includes(poseId) ? prev.filter((x) => x !== poseId) : [...prev, poseId],
    )
  }

  const removeCustom = (name: string) => {
    setDraftCustoms((prev) => prev.filter((x) => x !== name))
  }

  const addCustom = () => {
    const n = customInput.trim()
    if (!n) return
    if (draftCustoms.includes(n)) return
    setDraftCustoms((prev) => [...prev, n])
    setCustomInput('')
  }

  const totalSelected = draftIds.length + draftCustoms.length
  const handleDone = () => onDone(draftIds, draftCustoms)

  if (!open) return null

  return (
    <View className='pose-picker-sheet-overlay'>
      <View className='pose-picker-sheet'>
        {/* Header */}
        <View className='pps-header'>
          <View className='pps-header-titles'>
            <Text className='pps-title'>选{poseNoun}</Text>
            <Text className='pps-subtitle'>{activityLabel} · 已选 {totalSelected} 个</Text>
          </View>
          <View className='pps-close' onClick={onClose}>
            <Text className='pps-close-x'>×</Text>
          </View>
        </View>

        {/* Search */}
        <View className='pps-search'>
          <Input
            className='pps-search-input'
            value={search}
            placeholder={`搜${poseNoun}名字（中文 / 英文 / 原文）`}
            onInput={(e: any) => setSearch(e?.detail?.value ?? '')}
          />
          {search && (
            <Text className='pps-search-clear' onClick={() => setSearch('')}>×</Text>
          )}
        </View>

        {/* Family tab row */}
        {familiesInActivity.length > 0 && (
          <ScrollView className='pps-family-row' scrollX enhanced showScrollbar={false}>
            <Text
              className={`pps-family-chip ${family === '全部' ? 'active' : ''}`}
              onClick={() => setFamily('全部')}
            >全部</Text>
            {familiesInActivity.map((f) => (
              <Text
                key={f}
                className={`pps-family-chip ${family === f ? 'active' : ''}`}
                onClick={() => setFamily(f)}
              >{f}</Text>
            ))}
          </ScrollView>
        )}

        {/* Pose grid · body scrolls */}
        <ScrollView className='pps-body' scrollY enhanced showScrollbar={false}>
          {filtered.length === 0 && combinedPoses.length === 0 && (
            <View className='pps-empty'>
              <Text className='pps-empty-title'>此品类还没有 pose</Text>
              <Text className='pps-empty-sub'>下方自定义快速加一个，或"添加自定义"完整创建</Text>
            </View>
          )}
          {filtered.length === 0 && combinedPoses.length > 0 && (
            <View className='pps-empty'>
              <Text className='pps-empty-title'>没有匹配的结果</Text>
              <Text className='pps-empty-sub'>换个词试试，或用下方自定义</Text>
            </View>
          )}
          {filtered.length > 0 && (
            <View className='pps-grid'>
              {filtered.map((p) => {
                const isChecked = draftIds.includes(p.id)
                return (
                  <View
                    key={p.id}
                    className={`pps-tile ${isChecked ? 'checked' : ''}`}
                    onClick={() => togglePose(p.id)}
                  >
                    {/* 占位缩略图 · Sprint 3 换真图 */}
                    <View className='pps-thumb-placeholder'>
                      <Text className='pps-thumb-family'>{p.family}</Text>
                    </View>
                    <Text className='pps-tile-name'>{p.nameZh}</Text>
                    {p.nameEn && <Text className='pps-tile-en'>{p.nameEn}</Text>}
                    {p.isUserPose && <Text className='pps-tile-badge'>我加的</Text>}
                    {isChecked && <View className='pps-check-badge'>✓</View>}
                  </View>
                )
              })}
            </View>
          )}

          {/* 已加的自定义 · 在 grid 下面独立一段展示 */}
          {draftCustoms.length > 0 && (
            <View className='pps-custom-list'>
              <Text className='pps-custom-list-label'>已加的自定义</Text>
              <View className='pps-custom-chips'>
                {draftCustoms.map((n) => (
                  <View key={n} className='pps-custom-chip'>
                    <Text className='pps-custom-name'>{n}</Text>
                    <Text className='pps-custom-remove' onClick={() => removeCustom(n)}>×</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer · 自定义输入 + 添加自定义页入口 + 完成 */}
        <View className='pps-footer'>
          <View className='pps-custom-add-row'>
            <Input
              className='pps-custom-input'
              value={customInput}
              placeholder='＋ 直接写一个'
              onInput={(e: any) => setCustomInput(e?.detail?.value ?? '')}
              onConfirm={addCustom}
              confirmType='done'
              maxlength={40}
            />
            {customInput.trim() && (
              <Text className='pps-custom-add-btn' onClick={addCustom}>加</Text>
            )}
          </View>
          {onGoAddCustom && (
            <Text className='pps-add-detailed' onClick={onGoAddCustom}>
              找不到？添加自定义（带图片+肌肉映射）›
            </Text>
          )}
          <View className='pps-done-btn' onClick={handleDone}>
            <Text className='pps-done-label'>完成（已选 {totalSelected} 个）</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
