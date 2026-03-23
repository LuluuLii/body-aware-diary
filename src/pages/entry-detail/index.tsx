import { useEffect, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useDiaryStore } from '@/store'
import { ACTIVITY_TYPE_LABELS, FEELING_EMOJIS, FEELING_LABELS } from '@/utils/constants'
import { BODY_PART_LABELS, SENSATION_LABELS, SENSATION_COLORS } from '@/types/body'
import { formatDateTime, formatDuration } from '@/utils/date'
import './index.scss'

export default function EntryDetail() {
  const router = useRouter()
  const { currentEntry, isLoading, getEntry, deleteEntry, toggleFavorite, clearCurrent } = useDiaryStore()
  const id = router.params.id

  useEffect(() => {
    if (id) getEntry(id)
    return () => clearCurrent()
  }, [id])

  const handleDelete = useCallback(() => {
    if (!id) return
    Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这篇日记吗？',
      confirmColor: '#EF4444',
      success: async (res) => {
        if (res.confirm) {
          await deleteEntry(id)
          Taro.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => Taro.navigateBack(), 500)
        }
      },
    })
  }, [id, deleteEntry])

  const handleEdit = useCallback(() => {
    if (!id) return
    Taro.navigateTo({ url: `/pages/record/index?id=${id}` })
  }, [id])

  const handleFav = useCallback(() => {
    if (!id) return
    toggleFavorite(id)
  }, [id, toggleFavorite])

  if (isLoading || !currentEntry) {
    return (
      <View className='detail-page'>
        <View className='detail-page__loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  const entry = currentEntry

  return (
    <View className='detail-page'>
      <ScrollView scrollY className='detail-page__scroll'>
        {/* Header */}
        <View className='detail-page__header'>
          <View className='detail-page__type-badge'>
            {ACTIVITY_TYPE_LABELS[entry.activity_type]}
          </View>
          {entry.activity_name && (
            <Text className='detail-page__activity-name'>{entry.activity_name}</Text>
          )}
        </View>

        <Text className='detail-page__title'>{entry.title}</Text>
        <Text className='detail-page__date'>{formatDateTime(entry.created_at)}</Text>

        {/* Stats */}
        <View className='detail-page__stats'>
          {entry.duration_minutes && (
            <View className='detail-page__stat'>
              <Text className='detail-page__stat-value'>{formatDuration(entry.duration_minutes)}</Text>
              <Text className='detail-page__stat-label'>时长</Text>
            </View>
          )}
          {entry.intensity && (
            <View className='detail-page__stat'>
              <Text className='detail-page__stat-value'>{entry.intensity}/10</Text>
              <Text className='detail-page__stat-label'>强度</Text>
            </View>
          )}
          {entry.overall_feeling && (
            <View className='detail-page__stat'>
              <Text className='detail-page__stat-value'>{FEELING_EMOJIS[entry.overall_feeling]}</Text>
              <Text className='detail-page__stat-label'>{FEELING_LABELS[entry.overall_feeling]}</Text>
            </View>
          )}
        </View>

        {/* Body Annotations */}
        {entry.annotations.length > 0 && (
          <View className='detail-page__section'>
            <Text className='detail-page__section-title'>身体感知</Text>
            {entry.annotations.map((a) => (
              <View key={a.id} className='detail-page__ann-item'>
                <View
                  className='detail-page__ann-dot'
                  style={{ backgroundColor: SENSATION_COLORS[a.sensation] }}
                />
                <View className='detail-page__ann-info'>
                  <Text className='detail-page__ann-name'>{BODY_PART_LABELS[a.body_part]}</Text>
                  <Text className='detail-page__ann-detail'>
                    {SENSATION_LABELS[a.sensation]} · 强度 {a.intensity}/5
                  </Text>
                  {a.note && <Text className='detail-page__ann-note'>{a.note}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Content */}
        {entry.content && (
          <View className='detail-page__section'>
            <Text className='detail-page__section-title'>心得体会</Text>
            <Text className='detail-page__content'>{entry.content}</Text>
          </View>
        )}

        {/* Tags */}
        {entry.tags.length > 0 && (
          <View className='detail-page__tags'>
            {entry.tags.map((tag) => (
              <Text key={tag} className='detail-page__tag'>#{tag}</Text>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action bar */}
      <View className='detail-page__actions'>
        <View className='detail-page__action' onClick={handleEdit}>
          <Text className='detail-page__action-text'>编辑</Text>
        </View>
        <View className='detail-page__action' onClick={handleFav}>
          <Text className={`detail-page__action-text ${entry.is_favorite ? 'detail-page__action-text--danger' : ''}`}>
            {entry.is_favorite ? '♥ 已收藏' : '♡ 收藏'}
          </Text>
        </View>
        <View className='detail-page__action' onClick={handleDelete}>
          <Text className='detail-page__action-text detail-page__action-text--danger'>删除</Text>
        </View>
      </View>
    </View>
  )
}
