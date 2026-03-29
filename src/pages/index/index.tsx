import { useEffect, useCallback, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { useDiaryStore, useAuthStore } from '@/store'
import DiaryCard from '@/components/DiaryCard'
import { formatDate } from '@/utils/date'
import type { DiaryEntry, DiaryEntryWithAnnotations } from '@/types'
import { SensationType } from '@/types/body'
import './index.scss'

function groupByDate(entries: DiaryEntry[]): { date: string; entries: DiaryEntry[] }[] {
  const groups: Record<string, DiaryEntry[]> = {}
  for (const entry of entries) {
    const date = formatDate(entry.created_at)
    if (!groups[date]) groups[date] = []
    groups[date].push(entry)
  }
  return Object.entries(groups).map(([date, entries]) => ({ date, entries }))
}

// 找到需要「酸痛补录」的最近一次运动记录
// 条件：运动发生在 18h ~ 72h 前，且没有酸痛/疼痛类注释
function findSorenessCandidateEntry(entries: DiaryEntryWithAnnotations[]): DiaryEntryWithAnnotations | null {
  const now = Date.now()
  const h18 = 18 * 60 * 60 * 1000
  const h72 = 72 * 60 * 60 * 1000
  const sorenessTypes: SensationType[] = [SensationType.Soreness, SensationType.Pain, SensationType.Tightness]

  for (const entry of entries) {
    const age = now - new Date(entry.created_at).getTime()
    if (age < h18 || age > h72) continue
    const hasSoreness = entry.annotations.some(a => sorenessTypes.includes(a.sensation))
    if (!hasSoreness) return entry
  }
  return null
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 6) return '深夜了，\n感受此刻的宁静。'
  if (h < 10) return '早安，\n感受当下的流动。'
  if (h < 14) return '午间时光，\n让身体告诉你故事。'
  if (h < 18) return '下午好，\n觉察每一次呼吸。'
  return '晚安，\n回顾今天的身体记忆。'
}

export default function Index() {
  const { entries, isLoading, hasMore, fetchEntries, fetchMore, toggleFavorite } = useDiaryStore()
  const { loadProfile } = useAuthStore()
  useEffect(() => {
    loadProfile()
    fetchEntries()
  }, [])

  useDidShow(() => { fetchEntries() })
  usePullDownRefresh(() => { fetchEntries().then(() => Taro.stopPullDownRefresh()) })

  const handleTap = useCallback((id: string) => {
    Taro.navigateTo({ url: `/pages/entry-detail/index?id=${id}` })
  }, [])

  const handleCreate = useCallback(() => {
    Taro.navigateTo({ url: '/pages/record/index' })
  }, [])

  // 找到「酸痛补录」候选条目
  const sorenessCandidate = useMemo(
    () => findSorenessCandidateEntry(entries as any),
    [entries]
  )

  const handleSorenessLog = useCallback((entryId: string) => {
    Taro.navigateTo({ url: `/pages/soreness-patch/index?entryId=${entryId}` })
  }, [])

  const groups = groupByDate(entries)

  return (
    <View className='index-page'>
      {/* Greeting */}
      <View className='index-page__greeting'>
        <View className='section-header'>
          <Text className='section-header__en'>CURRENT STATE</Text>
          <Text className='section-header__divider'>/</Text>
          <Text className='section-header__zh'>此刻</Text>
        </View>
        <Text className='index-page__greeting-text'>{getGreeting()}</Text>
      </View>

      {entries.length === 0 && !isLoading ? (
        <View className='index-page__empty-hero'>
          <View className='index-page__empty-bg-circle index-page__empty-bg-circle--1' />
          <View className='index-page__empty-bg-circle index-page__empty-bg-circle--2' />
          <View className='index-page__empty-bg-circle index-page__empty-bg-circle--3' />
          <View className='index-page__empty-content'>
            <Text className='index-page__empty-eyebrow'>BODY AWARENESS</Text>
            <Text className='index-page__empty-headline'>你的身体{'\n'}比你更早知道</Text>
            <Text className='index-page__empty-body'>
              每一次运动，每一块酸痛，{'\n'}
              每一次呼吸里都藏着信息。{'\n'}
              开始记录，倾听它们。
            </Text>
            <View className='index-page__empty-cues'>
              {['肌肉的发力感', '心跳的节律', '疲惫与专注', '身体的边界'].map((cue) => (
                <Text key={cue} className='index-page__empty-cue'>· {cue}</Text>
              ))}
            </View>
            <View className='index-page__empty-action' onClick={handleCreate}>
              <Text className='index-page__empty-action-text'>开始第一次记录</Text>
              <Text className='index-page__empty-action-arrow'>→</Text>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView
          scrollY
          className='index-page__scroll'
          onScrollToLower={() => hasMore && fetchMore()}
        >
          {/* 酸痛补录提示横幅 */}
          {sorenessCandidate && (
            <View
              className='index-page__soreness-banner'
              onClick={() => handleSorenessLog(sorenessCandidate.id)}
            >
              <View className='index-page__soreness-banner-left'>
                <Text className='index-page__soreness-banner-icon'>◎</Text>
              </View>
              <View className='index-page__soreness-banner-body'>
                <Text className='index-page__soreness-banner-title'>运动后有哪里酸了吗？</Text>
                <Text className='index-page__soreness-banner-sub'>
                  {sorenessCandidate.title} · 补录延迟酸痛
                </Text>
              </View>
              <Text className='index-page__soreness-banner-arrow'>→</Text>
            </View>
          )}
          {/* Archive section */}
          <View className='section-header' style={{ padding: '0 8px' }}>
            <Text className='section-header__en'>ARCHIVE</Text>
            <Text className='section-header__divider'>/</Text>
            <Text className='section-header__zh'>觉察记录</Text>
          </View>

          {groups.map((group) => (
            <View key={group.date} className='index-page__group'>
              <Text className='index-page__date'>{group.date}</Text>
              {group.entries.map((entry) => (
                <DiaryCard
                  key={entry.id}
                  entry={entry}
                  onTap={handleTap}
                  onFavorite={(id) => toggleFavorite(id)}
                />
              ))}
            </View>
          ))}

          {isLoading && (
            <View className='index-page__loading'><Text>...</Text></View>
          )}
          {!hasMore && entries.length > 0 && (
            <View className='index-page__end'>
              <Text className='index-page__end-text'>· 已至尽头 ·</Text>
            </View>
          )}
        </ScrollView>
      )}

      <View className='index-page__fab' onClick={handleCreate}>
        <Text className='index-page__fab-text'>+</Text>
      </View>
    </View>
  )
}
