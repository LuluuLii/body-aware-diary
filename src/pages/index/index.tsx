import { useEffect, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { useDiaryStore, useAuthStore } from '@/store'
import DiaryCard from '@/components/DiaryCard'
import EmptyState from '@/components/EmptyState'
import { formatDate } from '@/utils/date'
import type { DiaryEntry } from '@/types'
import './index.scss'

// 按日期分组
function groupByDate(entries: DiaryEntry[]): { date: string; entries: DiaryEntry[] }[] {
  const groups: Record<string, DiaryEntry[]> = {}
  for (const entry of entries) {
    const date = formatDate(entry.created_at)
    if (!groups[date]) groups[date] = []
    groups[date].push(entry)
  }
  return Object.entries(groups).map(([date, entries]) => ({ date, entries }))
}

export default function Index() {
  const { entries, isLoading, hasMore, fetchEntries, fetchMore, toggleFavorite } = useDiaryStore()
  const { loadProfile } = useAuthStore()

  useEffect(() => {
    loadProfile()
    fetchEntries()
  }, [])

  useDidShow(() => {
    fetchEntries()
  })

  usePullDownRefresh(() => {
    fetchEntries().then(() => Taro.stopPullDownRefresh())
  })

  const handleTap = useCallback((id: string) => {
    Taro.navigateTo({ url: `/pages/entry-detail/index?id=${id}` })
  }, [])

  const handleFavorite = useCallback((id: string) => {
    toggleFavorite(id)
  }, [toggleFavorite])

  const handleCreate = useCallback(() => {
    Taro.navigateTo({ url: '/pages/record/index' })
  }, [])

  const groups = groupByDate(entries)

  return (
    <View className='index-page'>
      {entries.length === 0 && !isLoading ? (
        <EmptyState
          title='还没有日记'
          description='记录你的第一篇身体感知日记吧'
          action='开始记录'
          onAction={handleCreate}
        />
      ) : (
        <ScrollView
          scrollY
          className='index-page__scroll'
          onScrollToLower={() => hasMore && fetchMore()}
        >
          {groups.map((group) => (
            <View key={group.date} className='index-page__group'>
              <Text className='index-page__date'>{group.date}</Text>
              {group.entries.map((entry) => (
                <DiaryCard
                  key={entry.id}
                  entry={entry}
                  onTap={handleTap}
                  onFavorite={handleFavorite}
                />
              ))}
            </View>
          ))}
          {isLoading && (
            <View className='index-page__loading'>
              <Text>加载中...</Text>
            </View>
          )}
          {!hasMore && entries.length > 0 && (
            <View className='index-page__end'>
              <Text className='index-page__end-text'>没有更多了</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB 按钮 */}
      <View className='index-page__fab' onClick={handleCreate}>
        <Text className='index-page__fab-text'>+</Text>
      </View>
    </View>
  )
}
