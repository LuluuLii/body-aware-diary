// Supabase Edge Function: wechat-auth
// 微信小程序登录 -> Supabase JWT
//
// 环境变量:
// - WECHAT_APP_ID
// - WECHAT_APP_SECRET
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WECHAT_APP_ID = Deno.env.get('WECHAT_APP_ID')!
const WECHAT_APP_SECRET = Deno.env.get('WECHAT_APP_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const { code } = await req.json()
    if (!code) {
      return new Response(JSON.stringify({ error: '缺少 code 参数' }), { status: 400 })
    }

    // 1. 用 code 换取 openid + session_key
    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}&js_code=${code}&grant_type=authorization_code`
    const wxRes = await fetch(wxUrl)
    const wxData = await wxRes.json()

    if (wxData.errcode) {
      return new Response(JSON.stringify({ error: `微信登录失败: ${wxData.errmsg}` }), { status: 400 })
    }

    const { openid } = wxData

    // 2. 使用 service role 查找或创建用户
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 查找已有用户
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('wechat_openid', openid)
      .single()

    let userId: string

    if (existingProfile) {
      userId = existingProfile.id
    } else {
      // 创建新用户
      const email = `wx_${openid}@wechat.miniprogram`
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { wechat_openid: openid },
      })

      if (authError) throw authError
      userId = authUser.user.id

      // 创建 profile
      await supabaseAdmin.from('profiles').insert({
        id: userId,
        wechat_openid: openid,
        nickname: `用户${openid.slice(-6)}`,
      })
    }

    // 3. 生成自定义 JWT token
    const { data: session, error: signError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `wx_${openid}@wechat.miniprogram`,
    })

    // 使用 signInWithPassword 的替代方案：直接创建 session
    const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `wx_${openid}@wechat.miniprogram`,
    })

    // 简化方案：使用 admin API 直接创建 session
    const { data: sessionData } = await supabaseAdmin.auth.admin.createSession({ userId })

    return new Response(
      JSON.stringify({
        access_token: sessionData?.access_token,
        refresh_token: sessionData?.refresh_token,
        user: { id: userId, openid },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
