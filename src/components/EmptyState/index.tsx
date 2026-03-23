import { View, Text } from '@tarojs/components'
import './index.scss'

interface Props {
  title: string
  description?: string
  action?: string
  onAction?: () => void
}

export default function EmptyState({ title, description, action, onAction }: Props) {
  return (
    <View className='empty-state'>
      <Text className='empty-state__icon'>📝</Text>
      <Text className='empty-state__title'>{title}</Text>
      {description && <Text className='empty-state__desc'>{description}</Text>}
      {action && onAction && (
        <View className='empty-state__btn' onClick={onAction}>
          <Text className='empty-state__btn-text'>{action}</Text>
        </View>
      )}
    </View>
  )
}
