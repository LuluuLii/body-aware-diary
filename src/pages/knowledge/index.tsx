import { useState, useEffect, useCallback } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/store'
import { knowledgeService } from '@/services/knowledge'
import { llmService } from '@/services/llm'
import { KNOWLEDGE_CATEGORY_LABELS } from '@/types/knowledge'
import type { KnowledgeCard, KnowledgeCategory, ChatMessage } from '@/types'
import './index.scss'

const CATEGORIES = Object.entries(KNOWLEDGE_CATEGORY_LABELS) as [KnowledgeCategory, string][]

const SUGGESTED_QUESTIONS = [
  '训练后肩膀酸痛是什么原因？',
  '如何提高对核心肌群的控制感？',
  '深蹲时怎样感知臀部发力？',
  '运动后放松有什么好方法？',
]

export default function Knowledge() {
  const { profile } = useAuthStore()
  const [tab, setTab] = useState<'browse' | 'chat'>('browse')

  // Browse state
  const [cards, setCards] = useState<KnowledgeCard[]>([])
  const [category, setCategory] = useState<KnowledgeCategory | null>(null)
  const [loadingCards, setLoadingCards] = useState(false)

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    loadCards()
  }, [category])

  const loadCards = async () => {
    setLoadingCards(true)
    try {
      const data = await knowledgeService.listCards({
        category: category || undefined,
        limit: 20,
      })
      setCards(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingCards(false)
    }
  }

  const handleCardTap = useCallback((id: string) => {
    Taro.navigateTo({ url: `/pages/knowledge-detail/index?id=${id}` })
  }, [])

  const sendMessage = useCallback(async (text?: string) => {
    const msg = text || input.trim()
    if (!msg) return

    if (!profile?.llm_api_key) {
      Taro.showModal({
        title: '未配置 LLM',
        content: '请先在"我的"页面配置 API Key',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) Taro.switchTab({ url: '/pages/profile/index' })
        },
      })
      return
    }

    const userMsg: ChatMessage = { role: 'user', content: msg }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setChatLoading(true)

    try {
      const response = await llmService.chat(newMessages)
      setMessages([...newMessages, { role: 'assistant', content: response.content }])
    } catch (err: any) {
      setMessages([...newMessages, { role: 'assistant', content: `请求失败: ${err.message}` }])
    } finally {
      setChatLoading(false)
    }
  }, [input, messages, profile])

  return (
    <View className='knowledge-page'>
      {/* Tab switcher */}
      <View className='knowledge-page__tabs'>
        <View
          className={`knowledge-page__tab ${tab === 'browse' ? 'knowledge-page__tab--active' : ''}`}
          onClick={() => setTab('browse')}
        >
          <Text className='knowledge-page__tab-text'>知识库</Text>
        </View>
        <View
          className={`knowledge-page__tab ${tab === 'chat' ? 'knowledge-page__tab--active' : ''}`}
          onClick={() => setTab('chat')}
        >
          <Text className='knowledge-page__tab-text'>问答</Text>
        </View>
      </View>

      {/* Browse mode */}
      {tab === 'browse' && (
        <View className='knowledge-page__browse'>
          {/* Browse mode */}
          <View className='knowledge-page__categories'>
            <View
              className={`knowledge-page__cat ${!category ? 'knowledge-page__cat--active' : ''}`}
              onClick={() => setCategory(null)}
            >
              <Text className='knowledge-page__cat-text'>全部</Text>
            </View>
            {CATEGORIES.map(([key, label]) => (
              <View
                key={key}
                className={`knowledge-page__cat ${category === key ? 'knowledge-page__cat--active' : ''}`}
                onClick={() => setCategory(category === key ? null : key)}
              >
                <Text className='knowledge-page__cat-text'>{label}</Text>
              </View>
            ))}
          </View>

          <ScrollView scrollY className='knowledge-page__card-list'>
            {loadingCards && <View className='knowledge-page__status'><Text>加载中...</Text></View>}
            {!loadingCards && cards.length === 0 && (
              <View className='knowledge-page__status'>
                <Text className='knowledge-page__empty-text'>暂无知识卡片</Text>
                <Text className='knowledge-page__empty-sub'>知识库内容即将上线</Text>
              </View>
            )}
            {cards.map((card) => (
              <View key={card.id} className='knowledge-page__card' onClick={() => handleCardTap(card.id)}>
                <View className='knowledge-page__card-header'>
                  <Text className='knowledge-page__card-cat'>
                    {KNOWLEDGE_CATEGORY_LABELS[card.category]}
                  </Text>
                  {card.difficulty && (
                    <Text className='knowledge-page__card-diff'>
                      {'★'.repeat(card.difficulty)}
                    </Text>
                  )}
                </View>
                <Text className='knowledge-page__card-title'>{card.title}</Text>
                {card.summary && (
                  <Text className='knowledge-page__card-summary'>{card.summary}</Text>
                )}
                {card.tags.length > 0 && (
                  <View className='knowledge-page__card-tags'>
                    {card.tags.slice(0, 3).map((t) => (
                      <Text key={t} className='knowledge-page__card-tag'>#{t}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <View className='knowledge-page__import-btn' onClick={() => Taro.navigateTo({ url: '/pages/import-material/index' })}>
            <Text className='knowledge-page__import-text'>导入我的资料</Text>
          </View>
        </View>
      )}

      {/* Chat mode */}
      {tab === 'chat' && (
        <View className='knowledge-page__chat'>
          <ScrollView scrollY className='knowledge-page__messages'>
            {messages.length === 0 && (
              <View className='knowledge-page__suggestions'>
                <Text className='knowledge-page__suggest-title'>试试问我：</Text>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <View key={q} className='knowledge-page__suggest-item' onClick={() => sendMessage(q)}>
                    <Text className='knowledge-page__suggest-text'>{q}</Text>
                  </View>
                ))}
              </View>
            )}
            {messages.map((msg, i) => (
              <View key={i} className={`knowledge-page__msg knowledge-page__msg--${msg.role}`}>
                <Text className='knowledge-page__msg-text'>{msg.content}</Text>
              </View>
            ))}
            {chatLoading && (
              <View className='knowledge-page__msg knowledge-page__msg--assistant'>
                <Text className='knowledge-page__msg-text'>思考中...</Text>
              </View>
            )}
          </ScrollView>

          <View className='knowledge-page__input-bar'>
            <Input
              className='knowledge-page__chat-input'
              placeholder='输入你的问题...'
              value={input}
              onInput={(e) => setInput(e.detail.value)}
              onConfirm={() => sendMessage()}
              confirmType='send'
            />
            <View className='knowledge-page__send-btn' onClick={() => sendMessage()}>
              <Text className='knowledge-page__send-text'>发送</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
