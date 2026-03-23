import { View, Text } from '@tarojs/components'
import { ACTIVITY_TYPE_LABELS, FEELING_EMOJIS } from '@/utils/constants'
import { formatRelativeTime, formatDuration } from '@/utils/date'
import { BODY_PART_LABELS, SENSATION_LABELS } from '@/types/body'
import type { DiaryEntry, BodyAnnotation } from '@/types'
import './index.scss'

interface Props {
  entry: DiaryEntry & { annotations?: BodyAnnotation[] }
  onTap?: (id: string) => void
  onFavorite?: (id: string) => void
}

export default function DiaryCard({ entry, onTap, onFavorite }: Props) {
  const annotations = entry.annotations || []

  return (
    <View className='diary-card zen-card' onClick={() => onTap?.(entry.id)}>
      {/* Title row */}
      <Text className='diary-card__title'>{entry.title}</Text>

      {/* Content preview */}
      {entry.content && (
        <Text className='diary-card__content'>
          {entry.content.slice(0, 100)}{entry.content.length > 100 ? '...' : ''}
        </Text>
      )}

      {/* Annotations */}
      {annotations.length > 0 && (
        <View className='diary-card__annotations'>
          {annotations.slice(0, 4).map((a) => (
            <View key={a.id} className='zen-tag'>
              <Text className='zen-tag__text'>
                {BODY_PART_LABELS[a.body_part]}
              </Text>
            </View>
          ))}
          {annotations.length > 4 && (
            <View className='zen-tag zen-tag--warm'>
              <Text className='zen-tag__text'>+{annotations.length - 4}</Text>
            </View>
          )}
        </View>
      )}

      {/* Mood tags */}
      {entry.tags.length > 0 && (
        <View className='diary-card__tags'>
          {entry.tags.slice(0, 3).map((tag) => (
            <View key={tag} className='zen-tag zen-tag--warm'>
              <Text className='zen-tag__text'>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <View className='diary-card__footer'>
        <View className='diary-card__meta'>
          <Text className='diary-card__type'>
            {ACTIVITY_TYPE_LABELS[entry.activity_type]}
          </Text>
          {entry.duration_minutes && (
            <Text className='diary-card__stat'>{formatDuration(entry.duration_minutes)}</Text>
          )}
          <Text className='diary-card__time'>{formatRelativeTime(entry.created_at)}</Text>
        </View>
        {entry.overall_feeling && (
          <Text className='diary-card__feeling'>{FEELING_EMOJIS[entry.overall_feeling]}</Text>
        )}
      </View>
    </View>
  )
}
