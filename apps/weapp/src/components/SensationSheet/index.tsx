// SensationSheet · 底部滑出的肌肉感受选择器
// 触发时机：BodyMap 覆盖层里点选任一肌肉。
//
// 交互:
//   - 未标注 → 点 tag 即设置 + 关闭 sheet
//   - 已标注 → 当前 tag 高亮描边; 点同一个 tag → toggle 移除; 点其他 → 切换; 点 × 移除按钮 → 取消
//
// 这样兼顾了新手（外露"移除"按钮明确）+ 老手（点当前 tag toggle 手感）。

import { View, Text } from '@tarojs/components'
import type { MuscleLayoutEntry } from '@body-diary/assets'
import type { MuscleSensationTag } from '@body-diary/core'
import './index.scss'

// v2.7-B · pose 关联 chip 只用到 id + 名字，接受宽松 shape 兼容内置 Pose 和 UserPose
export interface PoseChipInfo {
  id: string
  nameZh: string
}

interface TagDef {
  key: MuscleSensationTag
  label: string
  cssVar: string
}

const TAG_DEFS: readonly TagDef[] = [
  { key: 'soreness',  label: '酸',   cssVar: 'var(--sensation-sour)'  },
  { key: 'tightness', label: '紧',   cssVar: 'var(--sensation-tight)' },
  { key: 'warmth',    label: '温',   cssVar: 'var(--sensation-warm)'  },
  { key: 'swell',     label: '涨',   cssVar: 'var(--sensation-swell)' },
  { key: 'none',      label: '无感', cssVar: 'var(--sensation-none)'  },
]

export interface SensationSheetProps {
  muscle: MuscleLayoutEntry
  /** Current annotation for this muscle, or undefined if not yet annotated */
  current: MuscleSensationTag | undefined
  /**
   * Called when user picks a tag or removes annotation.
   * next === undefined means "remove annotation".
   */
  onPick: (next: MuscleSensationTag | undefined) => void
  /** Called when user swipes down / clicks backdrop / picks a tag（v2.7-A: auto-close 保留 for 快速手感）*/
  onClose: () => void
  // ─── v2.7-A · 关联 pose (可选) ──────────────────────────
  /** 该 practice 里已选的候选 poses（内置或用户自建） */
  availablePoses?: readonly PoseChipInfo[]
  /** 当前肌肉标注关联到的 pose_id */
  currentPoseId?: string | null
  /** 用户 tap pose chip 时回调 · null 表示取消关联 */
  onPickPose?: (poseId: string | null) => void
}

export function SensationSheet({
  muscle,
  current,
  onPick,
  availablePoses,
  currentPoseId,
  onPickPose,
}: SensationSheetProps) {
  const handleTagPress = (tag: MuscleSensationTag) => {
    if (tag === current) onPick(undefined)
    else onPick(tag)
  }
  const handleRemove = () => onPick(undefined)

  const showPoseRow = availablePoses && availablePoses.length > 0 && !!onPickPose

  const togglePose = (poseId: string) => {
    if (!onPickPose) return
    onPickPose(currentPoseId === poseId ? null : poseId)
  }

  return (
    <View className='sensation-sheet'>
      <View className='grabber' />
      <View className='muscle-name'>{muscle.name}</View>
      <View className='muscle-region'>{muscle.region}</View>
      <View className='tag-row'>
        {TAG_DEFS.map((t) => {
          const active = t.key === current
          const style = active
            ? { background: t.cssVar, color: 'white', borderColor: t.cssVar }
            : { background: 'var(--color-chip-bg)', color: 'var(--color-ink)', borderColor: 'transparent' }
          return (
            <Text
              key={t.key}
              className={`tag-chip ${active ? 'active' : ''}`}
              style={style}
              onClick={() => handleTagPress(t.key)}
            >
              {t.label}
            </Text>
          )
        })}
      </View>

      {/* v2.7-A: 关联 pose · 只在有候选 pose 时显示；不 auto-close 让用户可以先标 tag 再关联 */}
      {showPoseRow && (
        <View className='pose-link-block'>
          <Text className='pose-link-label'>这块酸/紧是练哪个来的？<Text className='pose-link-optional'>（可选）</Text></Text>
          <View className='pose-link-chips'>
            {availablePoses!.map((p) => {
              const active = currentPoseId === p.id
              return (
                <Text
                  key={p.id}
                  className={`pose-link-chip ${active ? 'active' : ''}`}
                  onClick={() => togglePose(p.id)}
                >{p.nameZh}</Text>
              )
            })}
          </View>
        </View>
      )}

      {current !== undefined && (
        <View className='remove-row' onClick={handleRemove}>
          <Text className='remove-btn'>× 移除标注</Text>
        </View>
      )}
    </View>
  )
}
