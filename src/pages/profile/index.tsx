import { useState, useEffect } from 'react'
import { View, Text, Input, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore, useSettingsStore } from '@/store'
import { llmService } from '@/services/llm'
import { LLM_PROVIDER_LABELS, DEFAULT_MODELS } from '@/types/llm'
import { THEME_LABELS, type ThemeMode } from '@/utils/theme'
import type { LLMProvider } from '@/types'
import './index.scss'

const PROVIDERS = Object.entries(LLM_PROVIDER_LABELS) as [LLMProvider, string][]
const THEMES: { key: ThemeMode; label: string; colors: string[] }[] = [
  { key: 'fresh', label: '森林晨光（默认）', colors: ['#5C6B4F', '#C4A86B', '#F7F5F0'] },
  { key: 'classic', label: '大地深处', colors: ['#A0B08A', '#C4A86B', '#2A2A26'] },
]

export default function Profile() {
  const { profile, isLoggedIn, login, updateProfile, logout } = useAuthStore()
  const { theme, setThemeMode } = useSettingsStore()

  const [provider, setProvider] = useState<LLMProvider>('openai')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    if (profile) {
      setProvider((profile.llm_provider as LLMProvider) || 'openai')
      setApiKey(profile.llm_api_key || '')
      setModel(profile.llm_model || '')
      setBaseUrl(profile.llm_base_url || '')
    }
  }, [profile])

  const handleSaveConfig = async () => {
    try {
      await updateProfile({
        llm_provider: provider,
        llm_api_key: apiKey,
        llm_model: model || DEFAULT_MODELS[provider]?.[0] || '',
        llm_base_url: baseUrl || null,
      })
      Taro.showToast({ title: '保存成功', icon: 'success' })
    } catch (err: any) {
      Taro.showToast({ title: err.message || '保存失败', icon: 'none' })
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const result = await llmService.testConnection()
      Taro.showModal({ title: result.success ? '连接成功' : '连接失败', content: result.message, showCancel: false })
    } catch (err: any) {
      Taro.showModal({ title: '连接失败', content: err.message, showCancel: false })
    } finally {
      setTesting(false)
    }
  }

  const models = DEFAULT_MODELS[provider] || []
  const providerLabels = PROVIDERS.map(([, label]) => label)

  return (
    <View className='profile-page'>
      {/* User Info */}
      <View className='profile-page__user zen-card'>
        <View className='profile-page__avatar'>
          <Text className='profile-page__avatar-text'>
            {profile?.nickname?.charAt(0) || '?'}
          </Text>
        </View>
        <View className='profile-page__user-info'>
          <Text className='profile-page__nickname'>
            {profile?.nickname || '旅行者'}
          </Text>
          {!isLoggedIn && (
            <View className='profile-page__login-btn' onClick={login}>
              <Text className='profile-page__login-text'>微信登录</Text>
            </View>
          )}
        </View>
      </View>

      {/* Visual Theme */}
      <View className='profile-page__section zen-card'>
        <View className='section-header'>
          <Text className='section-header__en'>VISUAL</Text>
          <Text className='section-header__divider'>/</Text>
          <Text className='section-header__zh'>视觉风格</Text>
        </View>

        {THEMES.map((t) => (
          <View
            key={t.key}
            className={`profile-page__theme-item ${theme === t.key ? 'profile-page__theme-item--active' : ''}`}
            onClick={() => setThemeMode(t.key)}
          >
            <View className='profile-page__theme-info'>
              <Text className='profile-page__theme-name'>{t.label}</Text>
              <View className='profile-page__theme-colors'>
                {t.colors.map((c) => (
                  <View key={c} className='profile-page__color-dot' style={{ backgroundColor: c }} />
                ))}
              </View>
            </View>
            <View className={`profile-page__theme-radio ${theme === t.key ? 'profile-page__theme-radio--active' : ''}`} />
          </View>
        ))}
      </View>

      {/* LLM Config */}
      <View className='profile-page__section zen-card'>
        <View className='section-header'>
          <Text className='section-header__en'>SYSTEM</Text>
          <Text className='section-header__divider'>/</Text>
          <Text className='section-header__zh'>AI 配置</Text>
        </View>
        <Text className='profile-page__desc'>
          配置你的 AI 服务，用于知识问答
        </Text>

        <Text className='profile-page__label'>服务商</Text>
        <Picker
          mode='selector'
          range={providerLabels}
          value={PROVIDERS.findIndex(([k]) => k === provider)}
          onChange={(e) => {
            const idx = Number(e.detail.value)
            const [key] = PROVIDERS[idx]
            setProvider(key)
            setModel(DEFAULT_MODELS[key]?.[0] || '')
          }}
        >
          <View className='profile-page__picker'>
            <Text>{LLM_PROVIDER_LABELS[provider]}</Text>
            <Text className='profile-page__picker-arrow'>▼</Text>
          </View>
        </Picker>

        <Text className='profile-page__label'>API Key</Text>
        <View className='profile-page__key-row'>
          <Input
            className='zen-input'
            type={showKey ? 'text' : 'safe-password'}
            placeholder='输入 API Key'
            value={apiKey}
            onInput={(e) => setApiKey(e.detail.value)}
          />
          <View className='profile-page__toggle' onClick={() => setShowKey(!showKey)}>
            <Text>{showKey ? '隐藏' : '显示'}</Text>
          </View>
        </View>

        <Text className='profile-page__label'>模型</Text>
        {models.length > 0 ? (
          <Picker
            mode='selector'
            range={models}
            value={Math.max(0, models.indexOf(model))}
            onChange={(e) => setModel(models[Number(e.detail.value)])}
          >
            <View className='profile-page__picker'>
              <Text>{model || '选择模型'}</Text>
              <Text className='profile-page__picker-arrow'>▼</Text>
            </View>
          </Picker>
        ) : (
          <Input className='zen-input' placeholder='输入模型名称' value={model} onInput={(e) => setModel(e.detail.value)} />
        )}

        {provider === 'custom' && (
          <>
            <Text className='profile-page__label'>Base URL</Text>
            <Input className='zen-input' placeholder='https://api.example.com' value={baseUrl} onInput={(e) => setBaseUrl(e.detail.value)} />
          </>
        )}

        <View className='profile-page__actions'>
          <View className='zen-btn' style={{ flex: 1 }} onClick={handleSaveConfig}>
            <Text className='zen-btn__text'>保存配置</Text>
          </View>
          <View
            className={`zen-btn zen-btn--outline ${testing ? 'zen-btn--disabled' : ''}`}
            style={{ flex: 1 }}
            onClick={testing ? undefined : handleTest}
          >
            <Text className='zen-btn__text'>{testing ? '测试中...' : '测试连接'}</Text>
          </View>
        </View>
      </View>

      {isLoggedIn && (
        <View className='profile-page__section zen-card'>
          <View className='profile-page__logout' onClick={logout}>
            <Text className='profile-page__logout-text'>退出登录</Text>
          </View>
        </View>
      )}
    </View>
  )
}
