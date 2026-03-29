import { useState, useCallback } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useDiaryStore } from '@/store'
import DiaryCard from '@/components/DiaryCard'
import { ACTIVITY_TYPE_LABELS } from '@/utils/constants'
import type { ActivityType, DiaryEntry, SearchFilters } from '@/types'
import './index.scss'

const ACTIVITY_TYPES = Object.entries(ACTIVITY_TYPE_LABELS) as [ActivityType, string][]

export default function Search() {
  const { searchEntries, toggleFavorite } = useDiaryStore()
  const [query, setQuery] = useState('')
  const [activityFilter, setActivityFilter] = useState<ActivityType | null>(null)
  const [favOnly, setFavOnly] = useState(false)
  const [results, setResults] = useState<DiaryEntry[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const doSearch = useCallback(async () => {
    setLoading(true)
    setSearched(true)
    try {
      const filters: SearchFilters = {}
      if (query.trim()) filters.query = query.trim()
      if (activityFilter) filters.activity_type = activityFilter
      if (favOnly) filters.favorites_only = true
      const data = await searchEntries(filters)
      setResults(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [query, activityFilter, favOnly, searchEntries])

  const handleTap = useCallback((id: string) => {
    Taro.navigateTo({ url: `/pages/entry-detail/index?id=${id}` })
  }, [])

  return (
    <View className='search-page'>
      {/* Page title */}
      <View className='search-page__title-row'>
        <Text className='search-page__title-en'>REVIEW</Text>
        <Text className='search-page__title-divider'>/</Text>
        <Text className='search-page__title-zh'>回顾</Text>
      </View>

      <View className='search-page__bar'>
        <Input
          className='search-page__input'
          placeholder='搜索日记标题或内容...'
          value={query}
          onInput={(e) => setQuery(e.detail.value)}
          onConfirm={doSearch}
          confirmType='search'
        />
        <View className='search-page__search-btn' onClick={doSearch}>
          <Text className='search-page__search-text'>搜索</Text>
        </View>
      </View>

      {/* Filters - 平铺换行 */}
      <View className='search-page__filters'>
        <View
          className={`search-page__filter ${favOnly ? 'search-page__filter--active' : ''}`}
          onClick={() => { setFavOnly(!favOnly) }}
        >
          <Text className='search-page__filter-text'>♥ 收藏</Text>
        </View>
        {ACTIVITY_TYPES.map(([type, label]) => (
          <View
            key={type}
            className={`search-page__filter ${activityFilter === type ? 'search-page__filter--active' : ''}`}
            onClick={() => setActivityFilter(activityFilter === type ? null : type)}
          >
            <Text className='search-page__filter-text'>{label}</Text>
          </View>
        ))}
      </View>

      {/* Results */}
      <ScrollView scrollY className='search-page__results'>
        {loading && (
          <View className='search-page__status'>
            <Text>搜索中...</Text>
          </View>
        )}
        {!loading && searched && results.length === 0 && (
          <View className='search-page__status'>
            <Text className='search-page__empty'>没有找到匹配的日记</Text>
          </View>
        )}
        {results.map((entry) => (
          <DiaryCard
            key={entry.id}
            entry={entry}
            onTap={handleTap}
            onFavorite={(id) => toggleFavorite(id)}
          />
        ))}
      </ScrollView>
    </View>
  )
}
