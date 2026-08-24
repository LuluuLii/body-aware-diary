// Sprint 2 · 体式详情页 · v2.7-B 支持 user_pose
// URL: /pages/pose-detail/index?id=p_bridge / <uuid>
//
// 结构:
//   1. Hero: 内置 pose 显示 PoseSketch；user_pose 显示占位块（Sprint 3 有图片后替换）
//   2. 中文名 + 英文/梵名 (user_pose 可能没有英文名)
//   3. 主要激活肌群卡（BodyFigure highlight + 肌群胶囊）
//   4. 发力感线索卡（若有）
//   5. 常见代偿点卡（若有）
//   6. 常见感受词卡（内置 pose 才有）
//   7. 我的发力感笔记卡（从 entries 反查）

import { useEffect, useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import {
  ensureProfile,
  listEntriesForPose,
  type DiaryEntry,
} from '@body-diary/core'
import { getMuscleByGroupId } from '@body-diary/content'
import { PoseSketch } from '@body-diary/assets'
import { IconArrowLeft } from '../../lib/icons'
import { getSupabase, ensureAnonymousSession } from '../../lib/supabase'
import { formatShortDate } from '../../lib/format'
import { BodyFigure } from '../../components/BodyFigure'
import { resolvePose } from '../../lib/poses'
import type { Pose } from '@body-diary/content'
import type { UserPose } from '@body-diary/core'
import './index.scss'

// 判断 raw 是内置 Pose（有 sketchKind / activationCue 字段）
function isBuiltinPose(raw: Pose | UserPose): raw is Pose {
  return 'sketchKind' in raw
}

export default function PoseDetail() {
  const router = useRouter()
  const poseId = (router.params?.id as string | undefined) ?? ''
  const resolved = useMemo(() => (poseId ? resolvePose(poseId) : undefined), [poseId])

  const [myNotes, setMyNotes] = useState<DiaryEntry[]>([])

  useEffect(() => {
    if (!poseId) return
    let cancelled = false
    ;(async () => {
      try {
        const session = await ensureAnonymousSession()
        if (!session || cancelled) return
        const client = getSupabase()
        await ensureProfile(client, session.user.id)
        const list = await listEntriesForPose(client, session.user.id, poseId)
        if (!cancelled) setMyNotes(list.filter((e) => e.activation_note?.trim()))
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[pose-detail] load failed', err)
      }
    })()
    return () => { cancelled = true }
  }, [poseId])

  const goBack = () => Taro.navigateBack()
  const goRecord = () => Taro.reLaunch({ url: '/pages/record/index' })
  const goEditUserPose = () => {
    // 未来: 编辑 user pose 页 (Sprint 3+)。暂时 toast 提示
    Taro.showToast({ title: '编辑自定义 · Sprint 3 会做', icon: 'none', duration: 1600 })
  }

  if (!resolved) {
    return (
      <View className='pose-detail-page paper-grid-bg'>
        <View className='top-bar'>
          <View className='back-btn' onClick={goBack}>
            <IconArrowLeft size={17} color='var(--color-text-secondary)' />
          </View>
        </View>
        <View className='not-found'>
          <Text className='not-found-title'>没找到这个动作</Text>
          <Text className='not-found-sub'>id: {poseId || '(空)'}</Text>
        </View>
      </View>
    )
  }

  const isUserPose = resolved.isUserPose
  const raw = resolved.raw
  const builtin = !isUserPose && isBuiltinPose(raw) ? raw : null
  const userPose = isUserPose && !isBuiltinPose(raw) ? raw : null

  // 主体式的原文名（内置=梵文；user_pose=用户填的 name_en）
  const secondaryName = builtin
    ? `${builtin.nameEn} · ${builtin.nameSanskrit}`
    : (userPose?.name_en || null)

  // Which view (front/back) to show
  // 用 reduce 代替 flatMap 避免 es2019 target 不兼容
  const highlightAssetIds = resolved.mainMuscleIds
    .map((gid) => getMuscleByGroupId(gid))
    .reduce<string[]>((acc, m) => {
      if (m?.assetIds) acc.push(...m.assetIds)
      return acc
    }, [])
  const backIds = ['trap','delt_bl','delt_br','lat_l','lat_r','erector','glute_l','glute_r','ham_l','ham_r','calf_l','calf_r']
  const backHits = highlightAssetIds.filter((id) => backIds.includes(id)).length
  const bodyView: 'front' | 'back' = backHits > highlightAssetIds.length / 2 ? 'back' : 'front'

  const activationCue = builtin?.activationCue || userPose?.activation_cue || null
  const compensation = builtin?.compensation || userPose?.compensation || null
  const sensationWords = builtin?.sensationWords ?? []

  return (
    <View className='pose-detail-page paper-grid-bg'>
      {/* Hero */}
      <View className='hero'>
        {builtin ? (
          <PoseSketch
            kind={builtin.sketchKind}
            size={140}
            stroke='var(--color-green-text)'
            groundColor='rgba(255,255,255,0.35)'
          />
        ) : (
          // user_pose 占位 · Sprint 3 有图片上传后替换成用户图
          <View className='hero-user-placeholder'>
            <Text className='hero-user-initial'>{resolved.nameZh.charAt(0)}</Text>
          </View>
        )}
        <View className='back-btn hero-back' onClick={goBack}>
          <IconArrowLeft size={17} color='var(--color-green-text)' />
        </View>
        {resolved.family && <Text className='hero-family'>{resolved.family}</Text>}
        {isUserPose && <Text className='hero-user-badge'>我加的</Text>}
      </View>

      <View className='content'>
        <Text className='pose-name-zh'>{resolved.nameZh}</Text>
        {secondaryName && <Text className='pose-name-en'>{secondaryName}</Text>}

        {/* 主要激活肌群 · 有肌群才显示 */}
        {resolved.mainMuscleIds.length > 0 && (
          <View className='card muscle-card'>
            <View className='muscle-fig'>
              <BodyFigure
                view={bodyView}
                mode='readonly'
                highlight={highlightAssetIds}
                size={66}
              />
            </View>
            <View className='muscle-body'>
              <Text className='sec-label'>主要激活肌群</Text>
              <View className='muscle-chips'>
                {resolved.mainMuscleIds.map((gid) => {
                  const m = getMuscleByGroupId(gid)
                  return (
                    <Text key={gid} className='muscle-chip'>
                      {m?.nameZh ?? gid}
                    </Text>
                  )
                })}
              </View>
            </View>
          </View>
        )}

        {/* 发力感线索 · 有才显示 */}
        {activationCue && (
          <View className='card'>
            <View className='sec-title-row'>
              <View className='dot dot-swell' />
              <Text className='sec-title'>发力感线索</Text>
            </View>
            <Text className='sec-body'>{activationCue}</Text>
          </View>
        )}

        {/* 常见代偿 · 有才显示 */}
        {compensation && (
          <View className='card'>
            <View className='sec-title-row'>
              <View className='dot dot-sour' />
              <Text className='sec-title'>常见代偿点</Text>
            </View>
            <Text className='sec-body'>{compensation}</Text>
          </View>
        )}

        {/* 常见感受词 · 仅内置 pose */}
        {sensationWords.length > 0 && (
          <View className='card'>
            <Text className='sec-label'>常见感受词 · 点一个直接开始记录</Text>
            <View className='word-chips'>
              {sensationWords.map((w) => (
                <Text key={w} className='word-chip' onClick={goRecord}>{w}</Text>
              ))}
            </View>
          </View>
        )}

        {/* user_pose 编辑入口 */}
        {isUserPose && (
          <View className='card' onClick={goEditUserPose}>
            <Text className='sec-body user-edit-hint'>这是你加的动作 · 编辑 (Sprint 3 会做) ›</Text>
          </View>
        )}

        {/* 我的发力感笔记 */}
        <View className='card my-notes-card'>
          <Text className='sec-label my-notes-label'>我的发力感笔记</Text>
          {myNotes.length === 0 ? (
            <Text className='my-notes-empty'>还没有留下过。下次做这个动作，试着记一句。</Text>
          ) : (
            <View className='my-notes-list'>
              {myNotes.slice(0, 4).map((e) => (
                <Text key={e.id} className='my-note-line'>
                  "{formatShortDate(e.created_at)} · {e.activation_note}"
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
