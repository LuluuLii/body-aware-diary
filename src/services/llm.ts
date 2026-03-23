import { supabase } from './supabase'
import type { ChatMessage, ChatResponse } from '@/types'

export const llmService = {
  async chat(messages: ChatMessage[], context?: string): Promise<ChatResponse> {
    const { data, error } = await supabase.functions.invoke('llm-proxy', {
      body: {
        action: 'chat',
        messages,
        context,
      },
    })

    if (error) throw new Error(`LLM 请求失败: ${error.message}`)
    return data as ChatResponse
  },

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.functions.invoke('llm-proxy', {
      body: {
        action: 'test',
        messages: [{ role: 'user', content: '请回复"连接成功"' }],
      },
    })

    return {
      success: !error,
      message: error?.message || data?.content || '连接成功',
    }
  },
}
