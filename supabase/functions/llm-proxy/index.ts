// Supabase Edge Function: llm-proxy
// RAG 增强的 LLM 代理，支持多 provider BYOK
//
// Actions:
// - chat: RAG 增强对话
// - search: 纯知识库检索
// - test: 测试 LLM 连接

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const BODY_AWARENESS_SYSTEM_PROMPT = `你是一位专业的运动科学和身体感知顾问。用户会向你提问关于身体感觉、肌肉控制、运动恢复、训练技巧等问题。请用中文回答，结合运动生理学和运动医学知识给出专业、实用的建议。如果涉及严重疼痛或伤病，请建议用户咨询专业医生。`

interface LLMAdapter {
  buildRequest(messages: any[], model: string, apiKey: string, baseUrl?: string): {
    url: string
    headers: Record<string, string>
    body: string
  }
  parseResponse(data: any): string
}

const adapters: Record<string, LLMAdapter> = {
  claude: {
    buildRequest(messages, model, apiKey) {
      const system = messages.find((m: any) => m.role === 'system')?.content || ''
      const filtered = messages.filter((m: any) => m.role !== 'system')
      return {
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          system,
          messages: filtered,
        }),
      }
    },
    parseResponse(data) {
      return data.content?.[0]?.text || ''
    },
  },
  openai: {
    buildRequest(messages, model, apiKey, baseUrl) {
      return {
        url: `${baseUrl || 'https://api.openai.com'}/v1/chat/completions`,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages, max_tokens: 2048 }),
      }
    },
    parseResponse(data) {
      return data.choices?.[0]?.message?.content || ''
    },
  },
}

// 智谱/通义/DeepSeek 都兼容 OpenAI 格式
const openaiCompatible = (defaultUrl: string): LLMAdapter => ({
  buildRequest(messages, model, apiKey, baseUrl) {
    return adapters.openai.buildRequest(messages, model, apiKey, baseUrl || defaultUrl)
  },
  parseResponse: adapters.openai.parseResponse,
})

adapters.zhipu = openaiCompatible('https://open.bigmodel.cn/api/paas')
adapters.tongyi = openaiCompatible('https://dashscope.aliyuncs.com/compatible-mode')
adapters.deepseek = openaiCompatible('https://api.deepseek.com')
adapters.custom = adapters.openai

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    // 验证用户身份
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const token = authHeader?.replace('Bearer ', '')

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: '未授权' }), { status: 401 })
    }

    // 获取用户 LLM 配置
    const { data: profile } = await supabase
      .from('profiles')
      .select('llm_provider, llm_api_key, llm_model, llm_base_url')
      .eq('id', user.id)
      .single()

    const { action, messages, query, context } = await req.json()

    if (action === 'search') {
      // 纯知识库检索（不需要 LLM 配置）
      // TODO: 实现 embedding 检索
      const { data: cards } = await supabase
        .from('knowledge_cards')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(5)

      return new Response(JSON.stringify({ cards, needsLLM: (cards?.length || 0) === 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // chat 和 test 需要 LLM 配置
    if (!profile?.llm_provider || !profile?.llm_api_key) {
      return new Response(
        JSON.stringify({ error: '请先在设置中配置 LLM API Key' }),
        { status: 400 }
      )
    }

    const adapter = adapters[profile.llm_provider]
    if (!adapter) {
      return new Response(
        JSON.stringify({ error: `不支持的 LLM provider: ${profile.llm_provider}` }),
        { status: 400 }
      )
    }

    // 构建消息（注入 system prompt 和 context）
    const fullMessages = [
      { role: 'system', content: BODY_AWARENESS_SYSTEM_PROMPT },
      ...(context ? [{ role: 'system', content: `参考资料:\n${context}` }] : []),
      ...messages,
    ]

    const { url, headers, body } = adapter.buildRequest(
      fullMessages,
      profile.llm_model || 'gpt-4o-mini',
      profile.llm_api_key,
      profile.llm_base_url || undefined
    )

    const llmRes = await fetch(url, { method: 'POST', headers, body })
    const llmData = await llmRes.json()

    if (!llmRes.ok) {
      return new Response(
        JSON.stringify({ error: llmData.error?.message || 'LLM 请求失败' }),
        { status: llmRes.status }
      )
    }

    const content = adapter.parseResponse(llmData)

    return new Response(
      JSON.stringify({ content }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
