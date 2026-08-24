// Sprint 2.7-A · 图鉴（按动作 + 按肌肉群）
// - Tab: 按动作 / 按肌肉群
// - 按动作: activity 品类 tab → family tab → 卡片墙
//   （品类隔离：垫上只看瑜伽体式，芭蕾只看脚位/手位/动作，不混）
// - 按肌肉群: 肌群 tab + BodyFigure highlight + 描述 + 关联动作列表
// - "找不到？添加自定义" → 跳 pose-add 页（Sprint 2.7-B 会做，现在 toast 占位）

import { useEffect, useMemo, useState } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import {
  POSE_FAMILIES,
  getPosesByActivityType,
  getPosesByMuscleId,
  getMuscleByGroupId,
} from '@body-diary/content'
import {
  ensureProfile,
  listPractices,
  type ActivityType,
} from '@body-diary/core'
import { TabBar } from '../../components/TabBar'
import { BodyFigure } from '../../components/BodyFigure'
import { ACTIVITY_TYPE_LABELS, POSE_NOUN_BY_ACTIVITY } from '../../lib/format'
import { getSupabase, ensureAnonymousSession } from '../../lib/supabase'
import { useAppStore } from '../../store/useAppStore'
import './index.scss'

type PosesMode = 'action' | 'muscle'

// v2.7-B: 统一展示 shape
interface DisplayPose {
  id: string
  nameZh: string
  nameEn: string
  family: string
  activityType: ActivityType
  mainMuscleIds: readonly string[]
  isUserPose: boolean
}

const CUSTOM_FAMILY = '自定义'

// 6 主要肌肉群供 tab 选择（都有 assetIds）
const MUSCLE_GROUP_TABS = [
  { id: 'rectus',  label: '核心' },
  { id: 'glute',   label: '臀' },
  { id: 'hip',     label: '髋' },
  { id: 'ham',     label: '腿后侧' },
  { id: 'quad',    label: '大腿前侧' },
  { id: 'lat',     label: '肩背' },
]

// v2.7-B: 图鉴曝光核心 5 品类（跟 record 页 activity chip 对齐）
// 用户可以进任何品类添加自定义即使内置库为空，不再受"有数据"约束
const ACTIVITY_TABS: readonly ActivityType[] = ['yoga_mat', 'ballet', 'swimming', 'strength', 'other']

export default function Poses() {
  const [mode, setMode] = useState<PosesMode>('action')
  const [activity, setActivity] = useState<ActivityType>('yoga_mat')
  const [family, setFamily] = useState<string>('全部')
  const [search, setSearch] = useState('')
  const [muscleId, setMuscleId] = useState<string>(MUSCLE_GROUP_TABS[0].id)

  // v2.7-B: 合并内置 pose + 用户自建
  const userPoses = useAppStore((s) => s.userPoses)

  // v2.7-B · 每个 pose 的历史练习次数（跨 practices 聚合）· 用于减骨架感
  const [poseUseCounts, setPoseUseCounts] = useState<Record<string, number>>({})
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const session = await ensureAnonymousSession()
        if (!session || cancelled) return
        const client = getSupabase()
        await ensureProfile(client, session.user.id)
        // 拉全部 practices 聚合 pose_ids
        const practices = await listPractices(client, session.user.id, { limit: 500 })
        if (cancelled) return
        const counts: Record<string, number> = {}
        practices.forEach((p) => {
          p.pose_ids.forEach((id) => {
            counts[id] = (counts[id] ?? 0) + 1
          })
        })
        setPoseUseCounts(counts)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[poses] pose counts failed', err)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const combinedPoses = useMemo<DisplayPose[]>(() => {
    const builtins = getPosesByActivityType(activity).map<DisplayPose>((p) => ({
      id: p.id, nameZh: p.nameZh, nameEn: p.nameEn, family: p.family,
      activityType: p.activityType as ActivityType, mainMuscleIds: p.mainMuscleIds,
      isUserPose: false,
    }))
    const userAdapted = userPoses
      .filter((p) => p.activity_type === activity)
      .map<DisplayPose>((p) => ({
        id: p.id, nameZh: p.name_zh, nameEn: p.name_en ?? '',
        family: p.family ?? CUSTOM_FAMILY,
        activityType: p.activity_type, mainMuscleIds: p.main_muscle_ids,
        isUserPose: true,
      }))
    return [...builtins, ...userAdapted]
  }, [activity, userPoses])

  const familiesInActivity = useMemo<string[]>(() => {
    const set = new Set<string>()
    combinedPoses.forEach((p) => set.add(p.family))
    const ordered: string[] = POSE_FAMILIES.filter((f) => set.has(f))
    if (set.has(CUSTOM_FAMILY)) ordered.push(CUSTOM_FAMILY)
    return ordered
  }, [combinedPoses])

  const filteredByPose = useMemo(() => {
    const searchLower = search.trim().toLowerCase()
    let list = combinedPoses
    if (family !== '全部') list = list.filter((p) => p.family === family)
    if (searchLower) {
      list = list.filter((p) =>
        p.nameZh.toLowerCase().includes(searchLower) ||
        p.nameEn.toLowerCase().includes(searchLower),
      )
    }
    // v2.7-B · 按练习次数降序 · 你练过的优先浮起（0 次的按原顺序）
    return [...list].sort((a, b) => (poseUseCounts[b.id] ?? 0) - (poseUseCounts[a.id] ?? 0))
  }, [combinedPoses, family, search, poseUseCounts])

  const musclePoses = useMemo(() => getPosesByMuscleId(muscleId), [muscleId])
  const currentMuscle = useMemo(() => getMuscleByGroupId(muscleId), [muscleId])

  const handleActivityChange = (next: ActivityType) => {
    if (next === activity) return
    setActivity(next)
    setFamily('全部') // 换品类后重置 family（脚位/前屈 在跨品类下无意义）
  }

  const goPoseDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/pose-detail/index?id=${id}` })
  }
  const goAddCustom = () => {
    Taro.navigateTo({ url: `/pages/pose-add/index?activity=${activity}` })
  }

  const currentPoseNoun = POSE_NOUN_BY_ACTIVITY[activity]

  return (
    <View className='poses-page paper-grid-bg'>
      <Text className='page-title'>动作图鉴</Text>
      <Text className='page-sub'>识别参考，不是教程。用你的身体反馈作最后一票。</Text>

      {/* Segment */}
      <View className='segment'>
        <Text
          className={`seg-tab ${mode === 'action' ? 'active' : ''}`}
          onClick={() => setMode('action')}
        >按动作</Text>
        <Text
          className={`seg-tab ${mode === 'muscle' ? 'active' : ''}`}
          onClick={() => setMode('muscle')}
        >按肌肉群</Text>
      </View>

      {mode === 'action' && (
        <>
          {/* 品类 tab · 一级过滤 */}
          <ScrollView className='activity-tab-scroll' scrollX enhanced showScrollbar={false}>
            {ACTIVITY_TABS.map((a) => (
              <Text
                key={a}
                className={`activity-tab-chip ${activity === a ? 'active' : ''}`}
                onClick={() => handleActivityChange(a)}
              >{ACTIVITY_TYPE_LABELS[a]}</Text>
            ))}
          </ScrollView>

          {/* 搜索 */}
          <View className='search-bar'>
            <Text className='search-icon'>🔍</Text>
            <Input
              className='search-input'
              value={search}
              placeholder={`搜${currentPoseNoun}名字？`}
              onInput={(e: any) => setSearch(e.detail?.value ?? '')}
            />
          </View>

          {/* 家族 tab · 二级过滤（按当前品类内的 family） */}
          <ScrollView className='family-scroll' scrollX enhanced showScrollbar={false}>
            <Text
              className={`family-chip ${family === '全部' ? 'active' : ''}`}
              onClick={() => setFamily('全部')}
            >全部</Text>
            {familiesInActivity.map((f) => (
              <Text
                key={f}
                className={`family-chip ${family === f ? 'active' : ''}`}
                onClick={() => setFamily(f)}
              >{f}</Text>
            ))}
          </ScrollView>

          {/* 卡片 grid */}
          {filteredByPose.length === 0 ? (
            <View className='poses-empty'>
              <Text className='poses-empty-text'>
                {combinedPoses.length === 0
                  ? `${ACTIVITY_TYPE_LABELS[activity]} 品类下暂无${currentPoseNoun}，点下方按钮加一个`
                  : `没有匹配的${currentPoseNoun}`}
              </Text>
            </View>
          ) : (
            <View className='pose-grid'>
              {filteredByPose.map((p) => {
                const useCount = poseUseCounts[p.id] ?? 0
                return (
                  <View
                    key={p.id}
                    className='pose-card'
                    onClick={() => goPoseDetail(p.id)}
                  >
                    {/* 缩略图占位 · Sprint 3 会换真图 */}
                    <View className='pose-card-visual'>
                      <View className='pose-thumb-placeholder'>
                        <Text className='pose-thumb-family'>{p.family}</Text>
                      </View>
                      {p.isUserPose && <Text className='pose-card-user-badge'>我加的</Text>}
                      {useCount > 0 && (
                        <Text className='pose-card-count-badge'>练过 {useCount} 次</Text>
                      )}
                    </View>
                    <View className='pose-card-body'>
                      <Text className='pose-name-zh'>{p.nameZh}</Text>
                      {p.nameEn && <Text className='pose-name-en'>{p.nameEn}</Text>}
                      {p.mainMuscleIds.length > 0 && (
                        <Text className='pose-muscles'>
                          {p.mainMuscleIds.slice(0, 2).map((id) => getMuscleByGroupId(id)?.nameZh ?? id).join(' · ')}
                        </Text>
                      )}
                      <Text className='pose-card-cta'>看它练哪里 ›</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* 找不到？添加自定义 → 跳 pose-add 页（Sprint 2.7-B）*/}
          <View className='custom-name-cta' onClick={goAddCustom}>
            找不到？添加自定义 →
          </View>
        </>
      )}

      {mode === 'muscle' && (
        <>
          {/* 肌群 tab */}
          <ScrollView className='family-scroll' scrollX enhanced showScrollbar={false}>
            {MUSCLE_GROUP_TABS.map((m) => (
              <Text
                key={m.id}
                className={`family-chip ${muscleId === m.id ? 'active' : ''}`}
                onClick={() => setMuscleId(m.id)}
              >{m.label}</Text>
            ))}
          </ScrollView>

          {/* 肌肉信息卡 */}
          {currentMuscle && (
            <View className='muscle-info-card'>
              <View className='muscle-figure-slot'>
                <BodyFigure
                  view={muscleId === 'glute' || muscleId === 'ham' || muscleId === 'lat' ? 'back' : 'front'}
                  mode='readonly'
                  highlight={currentMuscle.assetIds}
                  size={78}
                />
              </View>
              <View className='muscle-info-body'>
                <Text className='muscle-name-zh'>{currentMuscle.nameZh}</Text>
                <Text className='muscle-name-en'>{currentMuscle.nameEn}</Text>
                <Text className='muscle-desc'>{currentMuscle.mainFunction}</Text>
                <Text className='muscle-region'>{currentMuscle.bodyRegion}</Text>
              </View>
            </View>
          )}

          <Text className='muscle-poses-label'>练到它的动作</Text>
          {musclePoses.length === 0 ? (
            <View className='poses-empty'>
              <Text className='poses-empty-text'>还没收录练到这块肌肉的动作。</Text>
            </View>
          ) : (
            <View className='pose-grid'>
              {musclePoses.map((p) => (
                <View
                  key={p.id}
                  className='pose-card'
                  onClick={() => goPoseDetail(p.id)}
                >
                  <View className='pose-card-visual'>
                    <View className='pose-thumb-placeholder'>
                      <Text className='pose-thumb-family'>{p.family}</Text>
                    </View>
                  </View>
                  <View className='pose-card-body'>
                    <Text className='pose-name-zh'>{p.nameZh}</Text>
                    <Text className='pose-muscles'>
                      {p.mainMuscleIds.slice(0, 3).map((id) => getMuscleByGroupId(id)?.nameZh ?? id).join(' · ')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      <TabBar active='poses' />
    </View>
  )
}
