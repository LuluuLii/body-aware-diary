// taroFetch · 把 fetch(url, init) 桥接到 Taro.request（内部走 wx.request）
//
// 用途：微信小程序没有全局 fetch()，supabase-js 默认调 fetch 就会挂。
// 传给 createSupabaseClient({ fetch }) 让 supabase 走这个 adapter。
//
// H5 分支直接返回原生 fetch，不走 Taro（避免多余包装）。

import Taro from '@tarojs/taro'

/** 构造一个 fetch-兼容的函数 · 内部走 Taro.request */
export function makeTaroFetch(): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : (input as any).url ?? input.toString()
    const method = (init?.method || 'GET').toUpperCase() as any

    // Headers 从 Headers 对象或 plain object 转成 record
    const headers: Record<string, string> = {}
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((v, k) => { headers[k] = v })
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([k, v]) => { headers[k] = v as string })
      } else {
        Object.assign(headers, init.headers as Record<string, string>)
      }
    }

    // Body: string / FormData / URLSearchParams / Blob
    let data: any = init?.body
    if (data instanceof URLSearchParams) data = data.toString()
    else if (typeof data === 'object' && data !== null && !(data instanceof ArrayBuffer)) {
      // 已经是 string 就不管；对象序列化交给 supabase 前置（它自己序列化）
      // FormData 不常见，先不处理
    }

    const res = await Taro.request({
      url,
      method,
      header: headers,
      data,
      // supabase 大多返回 JSON，但我们要能拿到 raw text 以兼容 error / non-JSON
      dataType: 'text' as any,
      responseType: 'text',
    })

    const bodyText = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)

    // 组一个 fetch-Response-shape 对象（supabase 只用 status, json(), text(), headers）
    const response = new Response(bodyText, {
      status: res.statusCode,
      statusText: '',
      headers: new Headers(res.header as Record<string, string>),
    })
    return response
  }) as typeof fetch
}

/** 按平台返回合适的 fetch · H5 用原生, weapp 用 Taro 桥 */
export function getPlatformFetch(): typeof fetch | undefined {
  if (process.env.TARO_ENV === 'h5') {
    // 原生 fetch —— supabase-js 不传 global.fetch 时它自己会取 globalThis.fetch
    return undefined
  }
  return makeTaroFetch()
}
