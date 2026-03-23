import { supabase } from './supabase'
import type { KnowledgeCard, UserMaterial, CreateMaterialInput, KnowledgeCategory } from '@/types'
import type { BodyPart } from '@/types/body'

export const knowledgeService = {
  // 知识卡片浏览
  async listCards(options?: {
    category?: KnowledgeCategory
    body_part?: BodyPart
    limit?: number
    offset?: number
  }): Promise<KnowledgeCard[]> {
    let query = supabase
      .from('knowledge_cards')
      .select('*')
      .order('created_at', { ascending: false })

    if (options?.category) {
      query = query.eq('category', options.category)
    }
    if (options?.body_part) {
      query = query.contains('body_parts', [options.body_part])
    }
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data, error } = await query
    if (error) throw error
    return data as KnowledgeCard[]
  },

  async getCard(id: string): Promise<KnowledgeCard> {
    const { data, error } = await supabase
      .from('knowledge_cards')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as KnowledgeCard
  },

  // 用户资料管理
  async listMaterials(): Promise<UserMaterial[]> {
    const { data, error } = await supabase
      .from('user_materials')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as UserMaterial[]
  },

  async createMaterial(input: CreateMaterialInput & { user_id: string }): Promise<UserMaterial> {
    const { data, error } = await supabase
      .from('user_materials')
      .insert(input)
      .select()
      .single()

    if (error) throw error

    // 异步触发 embedding 生成
    supabase.functions.invoke('embed-content', {
      body: { material_id: data.id },
    }).catch(() => {
      // embedding 失败不影响主流程
    })

    return data as UserMaterial
  },

  async deleteMaterial(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_materials')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // RAG 检索（通过 Edge Function）
  async searchKnowledge(query: string): Promise<{
    cards: KnowledgeCard[]
    needsLLM: boolean
  }> {
    const { data, error } = await supabase.functions.invoke('llm-proxy', {
      body: {
        action: 'search',
        query,
      },
    })

    if (error) throw error
    return data
  },
}
