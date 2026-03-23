import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ACTIVITY_TYPE_LABELS, FEELING_EMOJIS } from '@/utils/constants'
import { formatRelativeTime, formatDuration } from '@/utils/date'
import { BODY_PART_LABELS, SENSATION_COLORS } from '@/types/body'
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
    <View className='diary-card' onClick={() => onTap?.(entry.id)}>
      <View className='diary-card__header'>
        <View className='diary-card__type-badge'>
          {ACTIVITY_TYPE_LABELS[entry.activity_type]}
        </View>
        <Text className='diary-card__time'>
          {formatRelativeTime(entry.created_at)}
        </Text>
      </View>

      <Text className='diary-card__title'>{entry.title}</Text>

      {entry.content && (
        <Text className='diary-card__content'>
          {entry.content.slice(0, 80)}{entry.content.length > 80 ? '...' : ''}
        </Text>
      )}

      {annotations.length > 0 && (
        <View className='diary-card__annotations'>
          {annotations.slice(0, 5).map((a) => (
            <View
              key={a.id}
              className='diary-card__body-dot'
              style={{ backgroundColor: SENSATION_COLORS[a.sensation] }}
            >
              <Text className='diary-card__body-dot-text'>
                {BODY_PART_LABELS[a.body_part]}
              </Text>
            </View>
          ))}
          {annotations.length > 5 && (
            <View className='diary-card__body-dot diary-card__body-dot--more'>
              <Text className='diary-card__body-dot-text'>+{annotations.length - 5}</Text>
            </View>
          )}
        </View>
      )}

      <View className='diary-card__footer'>
        <View className='diary-card__stats'>
          {entry.duration_minutes && (
            <Text className='diary-card__stat'>
              {formatDuration(entry.duration_minutes)}
            </Text>
          )}
          {entry.overall_feeling && (
            <Text className='diary-card__stat'>
              {FEELING_EMOJIS[entry.overall_feeling]}
            </Text>
          )}
        </View>
        <View
          className={`diary-card__fav ${entry.is_favorite ? 'diary-card__fav--active' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onFavorite?.(entry.id)
          }}
        >
          {entry.is_favorite ? '♥' : '♡'}
        </View>
      </View>

      {entry.tags.length > 0 && (
        <View className='diary-card__tags'>
          {entry.tags.slice(0, 3).map((tag) => (
            <Text key={tag} className='diary-card__tag'>#{tag}</Text>
          ))}
        </View>
      )}
    </View>
  )
}
