import Taro from '@tarojs/taro'
import { supabase } from './supabase'

export async function wechatLogin() {
  // 1. 获取微信临时 code
  const { code } = await Taro.login()

  // 2. 调用 Edge Function 换取 Supabase session
  const { data, error } = await supabase.functions.invoke('wechat-auth', {
    body: { code },
  })

  if (error) throw new Error(`登录失败: ${error.message}`)

  // 3. 设置 Supabase session
  if (data.access_token && data.refresh_token) {
    await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    })
  }

  return data.user
}

export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function updateProfile(updates: Record<string, any>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function logout() {
  await supabase.auth.signOut()
}
