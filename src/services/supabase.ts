import Taro from '@tarojs/taro'
import { createClient } from '@supabase/supabase-js'

// Taro-compatible storage adapter for Supabase auth
const taroStorage = {
  getItem: (key: string) => {
    try {
      return Taro.getStorageSync(key) || null
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string) => {
    try {
      Taro.setStorageSync(key, value)
    } catch {
      // ignore storage errors
    }
  },
  removeItem: (key: string) => {
    try {
      Taro.removeStorageSync(key)
    } catch {
      // ignore
    }
  },
}

// Taro-compatible fetch adapter wrapping Taro.request
const taroFetch: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : (input as Request).url
  const method = init?.method || 'GET'
  const headers = init?.headers as Record<string, string> || {}
  const body = init?.body

  try {
    const res = await Taro.request({
      url,
      method: method.toUpperCase() as keyof Taro.request.Method,
      header: headers,
      data: body ? (typeof body === 'string' ? JSON.parse(body) : body) : undefined,
    })

    return {
      ok: res.statusCode >= 200 && res.statusCode < 300,
      status: res.statusCode,
      statusText: String(res.statusCode),
      headers: new Headers(res.header || {}),
      json: async () => res.data,
      text: async () => (typeof res.data === 'string' ? res.data : JSON.stringify(res.data)),
      blob: async () => new Blob(),
      clone: () => ({ json: async () => res.data } as Response),
    } as Response
  } catch (err: any) {
    throw new Error(`Network request failed: ${err.errMsg || err.message}`)
  }
}

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: taroStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: taroFetch,
  },
})
