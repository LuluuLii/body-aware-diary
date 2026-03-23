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
      <View className='empty-state__circle' />
      <Text className='empty-state__title'>{title}</Text>
      {description && <Text className='empty-state__desc'>{description}</Text>}
      {action && onAction && (
        <View className='zen-btn' onClick={onAction} style={{ width: '280px' }}>
          <Text className='zen-btn__text'>{action}</Text>
        </View>
      )}
    </View>
  )
}
