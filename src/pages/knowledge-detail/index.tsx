import { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import { knowledgeService } from '@/services/knowledge'
import { KNOWLEDGE_CATEGORY_LABELS } from '@/types/knowledge'
import { BODY_PART_LABELS } from '@/types/body'
import type { KnowledgeCard } from '@/types'
import './index.scss'

export default function KnowledgeDetail() {
  const router = useRouter()
  const [card, setCard] = useState<KnowledgeCard | null>(null)
  const id = router.params.id

  useEffect(() => {
    if (id) {
      knowledgeService.getCard(id).then(setCard).catch(console.error)
    }
  }, [id])

  if (!card) {
    return (
      <View className='kd-page'>
        <View className='kd-page__loading'><Text>加载中...</Text></View>
      </View>
    )
  }

  return (
    <View className='kd-page'>
      <ScrollView scrollY className='kd-page__scroll'>
        <View className='kd-page__header'>
          <Text className='kd-page__cat'>{KNOWLEDGE_CATEGORY_LABELS[card.category]}</Text>
          {card.difficulty && <Text className='kd-page__diff'>{'★'.repeat(card.difficulty)}</Text>}
        </View>

        <Text className='kd-page__title'>{card.title}</Text>

        {card.summary && <Text className='kd-page__summary'>{card.summary}</Text>}

        <View className='kd-page__content'>
          <Text className='kd-page__content-text'>{card.content}</Text>
        </View>

        {card.body_parts.length > 0 && (
          <View className='kd-page__parts'>
            <Text className='kd-page__parts-label'>相关部位：</Text>
            {card.body_parts.map((p) => (
              <Text key={p} className='kd-page__part'>{BODY_PART_LABELS[p]}</Text>
            ))}
          </View>
        )}

        {card.tags.length > 0 && (
          <View className='kd-page__tags'>
            {card.tags.map((t) => (
              <Text key={t} className='kd-page__tag'>#{t}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
