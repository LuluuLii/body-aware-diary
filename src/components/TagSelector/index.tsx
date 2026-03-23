import { View, Text, Input } from '@tarojs/components'
import { useState } from 'react'
import './index.scss'

interface Props {
  tags: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  allowCustom?: boolean
  placeholder?: string
}

export default function TagSelector({ tags, selected, onChange, allowCustom = false, placeholder = '添加标签' }: Props) {
  const [customTag, setCustomTag] = useState('')

  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  const addCustom = () => {
    const tag = customTag.trim()
    if (tag && !selected.includes(tag)) {
      onChange([...selected, tag])
      setCustomTag('')
    }
  }

  return (
    <View className='tag-selector'>
      <View className='tag-selector__list'>
        {tags.map((tag) => (
          <View
            key={tag}
            className={`tag-selector__item ${selected.includes(tag) ? 'tag-selector__item--active' : ''}`}
            onClick={() => toggle(tag)}
          >
            <Text className='tag-selector__item-text'>{tag}</Text>
          </View>
        ))}
      </View>
      {allowCustom && (
        <View className='tag-selector__input-row'>
          <Input
            className='tag-selector__input'
            placeholder={placeholder}
            value={customTag}
            onInput={(e) => setCustomTag(e.detail.value)}
            onConfirm={addCustom}
          />
          {customTag.trim() && (
            <View className='tag-selector__add-btn' onClick={addCustom}>
              <Text className='tag-selector__add-text'>+</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}
