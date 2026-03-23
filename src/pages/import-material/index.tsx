import { useState } from 'react'
import { View, Text, Input, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/store'
import { knowledgeService } from '@/services/knowledge'
import TagSelector from '@/components/TagSelector'
import type { MaterialSource } from '@/types'
import './index.scss'

const SOURCES: { key: MaterialSource; label: string }[] = [
  { key: 'text_input', label: '手动输入' },
  { key: 'url_import', label: 'URL 导入' },
  { key: 'clipboard', label: '粘贴内容' },
]

export default function ImportMaterial() {
  const { profile } = useAuthStore()
  const [source, setSource] = useState<MaterialSource>('text_input')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const handlePaste = async () => {
    try {
      const data = await Taro.getClipboardData()
      if (data.data) {
        setContent(data.data)
        Taro.showToast({ title: '已粘贴', icon: 'success' })
      }
    } catch {
      Taro.showToast({ title: '粘贴失败', icon: 'none' })
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入标题', icon: 'none' })
      return
    }
    if (!content.trim()) {
      Taro.showToast({ title: '请输入内容', icon: 'none' })
      return
    }
    if (!profile?.id) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    setSaving(true)
    try {
      await knowledgeService.createMaterial({
        user_id: profile.id,
        title: title.trim(),
        content: content.trim(),
        source,
        source_url: url.trim() || undefined,
        tags,
      })
      Taro.showToast({ title: '导入成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 500)
    } catch (err: any) {
      Taro.showToast({ title: err.message || '导入失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <View className='import-page'>
      <View className='import-page__section'>
        <Text className='import-page__label'>导入方式</Text>
        <View className='import-page__sources'>
          {SOURCES.map((s) => (
            <View
              key={s.key}
              className={`import-page__source ${source === s.key ? 'import-page__source--active' : ''}`}
              onClick={() => setSource(s.key)}
            >
              <Text className='import-page__source-text'>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text className='import-page__label'>标题 *</Text>
        <Input
          className='import-page__input'
          placeholder='给资料起个标题'
          value={title}
          onInput={(e) => setTitle(e.detail.value)}
        />

        {source === 'url_import' && (
          <>
            <Text className='import-page__label'>URL</Text>
            <Input
              className='import-page__input'
              placeholder='https://...'
              value={url}
              onInput={(e) => setUrl(e.detail.value)}
            />
          </>
        )}

        <View className='import-page__content-header'>
          <Text className='import-page__label'>内容 *</Text>
          {source === 'clipboard' && (
            <View className='import-page__paste-btn' onClick={handlePaste}>
              <Text className='import-page__paste-text'>从剪贴板粘贴</Text>
            </View>
          )}
        </View>
        <Textarea
          className='import-page__textarea'
          placeholder='输入或粘贴学习资料内容...'
          value={content}
          onInput={(e) => setContent(e.detail.value)}
          maxlength={10000}
          autoHeight
        />

        <Text className='import-page__label'>标签</Text>
        <TagSelector
          tags={['解剖', '发力', '拉伸', '恢复', '冥想', '呼吸']}
          selected={tags}
          onChange={setTags}
          allowCustom
        />

        <View
          className={`import-page__btn ${saving ? 'import-page__btn--disabled' : ''}`}
          onClick={saving ? undefined : handleSave}
        >
          <Text className='import-page__btn-text'>{saving ? '保存中...' : '导入资料'}</Text>
        </View>
      </View>
    </View>
  )
}
