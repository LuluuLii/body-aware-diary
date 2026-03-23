import { useState, useEffect } from 'react'
import { View, Text, Input, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/store'
import { llmService } from '@/services/llm'
import { LLM_PROVIDER_LABELS, DEFAULT_MODELS } from '@/types/llm'
import type { LLMProvider } from '@/types'
import './index.scss'

const PROVIDERS = Object.entries(LLM_PROVIDER_LABELS) as [LLMProvider, string][]

export default function Profile() {
  const { profile, isLoggedIn, login, updateProfile, logout } = useAuthStore()

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
      Taro.showModal({
        title: result.success ? '连接成功' : '连接失败',
        content: result.message,
        showCancel: false,
      })
    } catch (err: any) {
      Taro.showModal({
        title: '连接失败',
        content: err.message,
        showCancel: false,
      })
    } finally {
      setTesting(false)
    }
  }

  const models = DEFAULT_MODELS[provider] || []
  const providerLabels = PROVIDERS.map(([, label]) => label)

  return (
    <View className='profile-page'>
      {/* User Info */}
      <View className='profile-page__user'>
        <View className='profile-page__avatar'>
          <Text className='profile-page__avatar-text'>
            {profile?.nickname?.charAt(0) || '?'}
          </Text>
        </View>
        <View className='profile-page__user-info'>
          <Text className='profile-page__nickname'>
            {profile?.nickname || '未登录'}
          </Text>
          {!isLoggedIn && (
            <View className='profile-page__login-btn' onClick={login}>
              <Text className='profile-page__login-text'>微信登录</Text>
            </View>
          )}
        </View>
      </View>

      {/* LLM Config */}
      <View className='profile-page__section'>
        <Text className='profile-page__section-title'>LLM 配置</Text>
        <Text className='profile-page__section-desc'>
          配置你自己的 AI 服务 API Key，用于知识问答功能
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
            className='profile-page__input'
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
          <Input
            className='profile-page__input'
            placeholder='输入模型名称'
            value={model}
            onInput={(e) => setModel(e.detail.value)}
          />
        )}

        {provider === 'custom' && (
          <>
            <Text className='profile-page__label'>Base URL</Text>
            <Input
              className='profile-page__input'
              placeholder='https://api.example.com'
              value={baseUrl}
              onInput={(e) => setBaseUrl(e.detail.value)}
            />
          </>
        )}

        <View className='profile-page__actions'>
          <View className='profile-page__btn profile-page__btn--primary' onClick={handleSaveConfig}>
            <Text className='profile-page__btn-text'>保存配置</Text>
          </View>
          <View
            className={`profile-page__btn profile-page__btn--outline ${testing ? 'profile-page__btn--disabled' : ''}`}
            onClick={testing ? undefined : handleTest}
          >
            <Text className='profile-page__btn-text profile-page__btn-text--outline'>
              {testing ? '测试中...' : '测试连接'}
            </Text>
          </View>
        </View>
      </View>

      {/* About */}
      {isLoggedIn && (
        <View className='profile-page__section'>
          <View className='profile-page__logout' onClick={logout}>
            <Text className='profile-page__logout-text'>退出登录</Text>
          </View>
        </View>
      )}
    </View>
  )
}
