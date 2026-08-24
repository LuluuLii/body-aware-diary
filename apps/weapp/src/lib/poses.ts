// Cross-source pose lookup · v2.7-B
// 把内置 POSES (packages/content) + 用户自建 user_poses (Zustand 缓存) 统一 lookup。
// pose_ids 里可能混着两种 id：内置短字符串 (p_xxx / b_xxx) 和 user_pose uuid。

import { getPoseById as getBuiltinPoseById, type Pose } from '@body-diary/content'
import type { UserPose } from '@body-diary/core'
import { useAppStore } from '../store/useAppStore'

export interface ResolvedPose {
  id: string
  nameZh: string
  nameEn: string | null
  family: string | null
  activityType: string
  mainMuscleIds: readonly string[]
  isUserPose: boolean
  /** 原始对象（Pose 或 UserPose），用于访问 source-specific 字段 */
  raw: Pose | UserPose
}

/** 从内置库 + 用户 pose 缓存里查 pose。找不到返回 undefined。同步（无 supabase 请求）。 */
export function resolvePose(id: string): ResolvedPose | undefined {
  if (!id) return undefined
  const builtin = getBuiltinPoseById(id)
  if (builtin) {
    return {
      id: builtin.id,
      nameZh: builtin.nameZh,
      nameEn: builtin.nameEn,
      family: builtin.family,
      activityType: builtin.activityType,
      mainMuscleIds: builtin.mainMuscleIds,
      isUserPose: false,
      raw: builtin,
    }
  }
  const userPose = useAppStore.getState().userPoses.find((p) => p.id === id)
  if (userPose) {
    return {
      id: userPose.id,
      nameZh: userPose.name_zh,
      nameEn: userPose.name_en,
      family: userPose.family,
      activityType: userPose.activity_type,
      mainMuscleIds: userPose.main_muscle_ids,
      isUserPose: true,
      raw: userPose,
    }
  }
  return undefined
}

/** 直接拿 pose 中文名 · 常用简化版 */
export function poseName(id: string): string | undefined {
  return resolvePose(id)?.nameZh
}

/** 按 activity 过滤用户 pose · 供 picker 展示 */
export function listUserPosesByActivity(activityType: string): UserPose[] {
  return useAppStore.getState().userPoses.filter((p) => p.activity_type === activityType)
}
