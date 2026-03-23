// Supabase Edge Function: embed-content
// 为用户资料生成文本向量 embedding

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const token = authHeader?.replace('Bearer ', '')

    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return new Response(JSON.stringify({ error: '未授权' }), { status: 401 })
    }

    const { material_id } = await req.json()

    // 获取用户 LLM 配置（需要 embedding API）
    const { data: profile } = await supabase
      .from('profiles')
      .select('llm_provider, llm_api_key, llm_base_url')
      .eq('id', user.id)
      .single()

    if (!profile?.llm_api_key) {
      return new Response(JSON.stringify({ error: '需要配置 API Key 才能生成向量' }), { status: 400 })
    }

    // 获取资料内容
    const { data: material } = await supabase
      .from('user_materials')
      .select('content')
      .eq('id', material_id)
      .eq('user_id', user.id)
      .single()

    if (!material) {
      return new Response(JSON.stringify({ error: '资料不存在' }), { status: 404 })
    }

    // 调用 embedding API（默认使用 OpenAI 兼容格式）
    const embeddingUrl = profile.llm_provider === 'claude'
      ? 'https://api.openai.com' // Claude 没有 embedding API，回退到 OpenAI
      : (profile.llm_base_url || 'https://api.openai.com')

    const embRes = await fetch(`${embeddingUrl}/v1/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${profile.llm_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: material.content.slice(0, 8000), // 限制长度
      }),
    })

    const embData = await embRes.json()

    if (!embRes.ok) {
      return new Response(JSON.stringify({ error: 'Embedding 生成失败' }), { status: 500 })
    }

    const embedding = embData.data?.[0]?.embedding

    // 更新资料的 embedding
    await supabase
      .from('user_materials')
      .update({ embedding, is_embedded: true })
      .eq('id', material_id)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
