// Supabase client singleton for the weapp shell.
// Env values injected via config/index.ts `defineConstants` at build time.

import Taro from '@tarojs/taro'
import { createSupabaseClient, type BodyDiarySupabaseClient } from '@body-diary/core'
import { getPlatformFetch } from './taroFetch'

let _client: BodyDiarySupabaseClient | null = null

export function getSupabase(): BodyDiarySupabaseClient {
  if (_client) return _client
  const url = process.env.SUPABASE_URL as string
  const anonKey = process.env.SUPABASE_ANON_KEY as string
  if (!url || !anonKey) {
    // eslint-disable-next-line no-console
    console.warn('[body-diary] Missing SUPABASE_URL / SUPABASE_ANON_KEY — check .env.local')
  }
  // weapp 端把 fetch 桥接到 Taro.request（wx.request）· H5 走原生 fetch
  _client = createSupabaseClient({
    url: url || '',
    anonKey: anonKey || '',
    fetch: getPlatformFetch(),
  })
  return _client
}

/**
 * v2.9 · 保证有一个可用的 supabase session.
 *
 * 平台分支:
 *   - weapp: 走微信登录 (wx.login → code → 阿里云 Supabase signInWithWeChat)
 *   - h5:    保留匿名登录 (方便开发时快速测试, 不需要真实微信 auth)
 *
 * 阿里云 Supabase 的 signInWithWeChat 是其在 GoTrue 基础上扩展的第三方登录能力,
 * 参考: help.aliyun.com/zh/analyticdb/... 《基于 Supabase 实现第三方登录》
 * 需要在 Supabase 后台 "Auth 配置" 里录入 AppID / AppSecret.
 */
export async function ensureSession() {
  const client = getSupabase()

  // 已有 session? 验一下 user 还在, 直接复用
  const { data: sessionData } = await client.auth.getSession()
  if (sessionData.session) {
    const { data: userData, error: userError } = await client.auth.getUser()
    if (userData?.user && !userError) return sessionData.session
    // Stale session (user 已被删) → 清掉重签
    await client.auth.signOut()
  }

  // POC 阶段: H5 + weapp 都走匿名登录. weapp 端的 signInWithWeChat 是阿里云
  // Supabase 的扩展 API, standard @supabase/supabase-js 没实现;
  // 待完成 wx.login 服务器换 code 的联调后, 再把 weapp 切回 signInWithWeChat().
  const { data: signInData, error } = await client.auth.signInAnonymously()
  if (error) throw error
  return signInData.session
}

/** 微信登录 · weapp 生产链路 */
async function signInWithWeChat() {
  const client = getSupabase()

  // 1. wx.login 拿 code
  const loginRes = await Taro.login()
  if (!loginRes.code) throw new Error(`wx.login failed: ${loginRes.errMsg}`)

  // 2. 走阿里云 Supabase 的第三方登录扩展
  // 注意: 这个 API shape 参考阿里云文档, 如果实际调用有出入需按 error 提示调整.
  // 阿里云 Supabase 会自动拿 code → 请求微信 API 换 openid → 建/查 user → 返 session.
  const { data, error } = await (client.auth as any).signInWithWeChat({
    code: loginRes.code,
  })
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[auth] signInWithWeChat failed', error)
    throw error
  }
  return data?.session ?? null
}

/**
 * @deprecated v2.9 起改用 ensureSession(). 保留 alias 避免调用点全改.
 * TODO: 完成微信登录联调后, 全项目搜替换 ensureAnonymousSession → ensureSession.
 */
export const ensureAnonymousSession = ensureSession
