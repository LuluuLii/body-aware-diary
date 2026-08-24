// 微信小程序 JS 运行时缺失的 Web API polyfill.
//
// supabase-js 内部会 `new Headers()` / `new Response()`; taroFetch 桥也会引用.
// H5 端浏览器原生就有这两个类, 不 polyfill.
//
// 只补 supabase 实际用到的 shape, 不追求 spec 完整.

type HeadersInit = Record<string, string> | Array<[string, string]> | HeadersShim

class HeadersShim {
  private _map = new Map<string, string>()

  constructor(init?: HeadersInit) {
    if (!init) return
    if (init instanceof HeadersShim) {
      init.forEach((v, k) => this.set(k, v))
    } else if (Array.isArray(init)) {
      for (const [k, v] of init) this.set(k, v)
    } else {
      for (const k of Object.keys(init)) this.set(k, (init as Record<string, string>)[k])
    }
  }

  get(name: string): string | null {
    return this._map.get(name.toLowerCase()) ?? null
  }
  set(name: string, value: string): void {
    this._map.set(name.toLowerCase(), String(value))
  }
  has(name: string): boolean {
    return this._map.has(name.toLowerCase())
  }
  append(name: string, value: string): void {
    const key = name.toLowerCase()
    const prev = this._map.get(key)
    this._map.set(key, prev ? `${prev}, ${value}` : String(value))
  }
  delete(name: string): void {
    this._map.delete(name.toLowerCase())
  }
  forEach(cb: (value: string, key: string) => void): void {
    this._map.forEach((v, k) => cb(v, k))
  }
  *entries(): IterableIterator<[string, string]> {
    for (const entry of this._map.entries()) yield entry
  }
  *keys(): IterableIterator<string> {
    for (const k of this._map.keys()) yield k
  }
  *values(): IterableIterator<string> {
    for (const v of this._map.values()) yield v
  }
  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries()
  }
}

class ResponseShim {
  readonly status: number
  readonly statusText: string
  readonly headers: HeadersShim
  readonly ok: boolean
  readonly url: string
  private _bodyText: string

  constructor(
    body?: string | null,
    init?: { status?: number; statusText?: string; headers?: HeadersInit; url?: string },
  ) {
    this._bodyText = body ?? ''
    this.status = init?.status ?? 200
    this.statusText = init?.statusText ?? ''
    this.ok = this.status >= 200 && this.status < 300
    this.url = init?.url ?? ''
    this.headers =
      init?.headers instanceof HeadersShim ? init.headers : new HeadersShim(init?.headers)
  }

  async text(): Promise<string> {
    return this._bodyText
  }
  async json(): Promise<unknown> {
    return this._bodyText ? JSON.parse(this._bodyText) : null
  }
  async arrayBuffer(): Promise<ArrayBuffer> {
    const buf = new ArrayBuffer(this._bodyText.length)
    const view = new Uint8Array(buf)
    for (let i = 0; i < this._bodyText.length; i++) view[i] = this._bodyText.charCodeAt(i)
    return buf
  }
  clone(): ResponseShim {
    return new ResponseShim(this._bodyText, {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      url: this.url,
    })
  }
}

// supabase-js 构造 RealtimeClient 时会立刻要拿 WebSocket 构造器,
// 即便我们不订阅任何 channel 也会走一遍. v1 不用 realtime, stub 一个空壳类即可;
// 未来若上 realtime, 换成基于 wx.connectSocket 的真实 adapter.
class WebSocketStub {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3
  readonly CONNECTING = 0
  readonly OPEN = 1
  readonly CLOSING = 2
  readonly CLOSED = 3
  readyState = 3
  binaryType: 'blob' | 'arraybuffer' = 'arraybuffer'
  onopen: ((ev: any) => void) | null = null
  onclose: ((ev: any) => void) | null = null
  onerror: ((ev: any) => void) | null = null
  onmessage: ((ev: any) => void) | null = null
  constructor(_url?: string, _protocols?: string | string[]) {
    // no-op — realtime not wired for weapp yet
  }
  send(_data: any): void {}
  close(_code?: number, _reason?: string): void {}
  addEventListener(): void {}
  removeEventListener(): void {}
}

// 微信 runtime 的 URL polyfill (Taro 会兜底一个) 对 `new URL(rel, base)` +
// 之后修改 `.protocol` 的组合支持不完整, 会导致 supabase-js 构造 realtimeUrl 时
// 输出的 `.href` 缺 slash → RealtimeClient 内部再 `new URL(href)` 抛
// "Failed to construct 'URL': Invalid URL".
//
// 这里写一个足够 supabase 用的 minimal WHATWG URL, 只覆盖 http(s) / ws(s):
// - `new URL(absolute)` / `new URL(relative, base)`
// - 属性: href, protocol, hostname, port, host, origin, pathname, search, hash, searchParams
// - 属性可写: protocol / pathname / search / hash / port (rehydrate href)
class URLShim {
  protocol = ''
  hostname = ''
  port = ''
  pathname = '/'
  search = ''
  hash = ''
  private _searchParams: URLSearchParams | null = null

  constructor(input: string, base?: string | URLShim) {
    let absolute: string
    if (/^[a-z][a-z0-9+\-.]*:\/\//i.test(input)) {
      absolute = input
    } else if (base) {
      const baseStr = typeof base === 'string' ? base : base.href
      const m = baseStr.match(/^([a-z][a-z0-9+\-.]*:\/\/[^/]+)(\/.*)?$/i)
      if (!m) throw new TypeError(`Failed to construct 'URL': Invalid base URL '${baseStr}'`)
      const origin = m[1]
      const basePath = m[2] ?? '/'
      if (input.startsWith('/')) {
        absolute = origin + input
      } else {
        const dir = basePath.replace(/[^/]*$/, '')
        absolute = origin + dir + input
      }
    } else {
      throw new TypeError(`Failed to construct 'URL': Invalid URL '${input}'`)
    }
    this._parse(absolute)
  }

  private _parse(url: string): void {
    const m = url.match(
      /^([a-z][a-z0-9+\-.]*:)\/\/([^/:?#]+)(?::(\d+))?(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i,
    )
    if (!m) throw new TypeError(`Failed to construct 'URL': Invalid URL '${url}'`)
    this.protocol = m[1].toLowerCase()
    this.hostname = m[2]
    this.port = m[3] ?? ''
    this.pathname = m[4] ?? '/'
    this.search = m[5] ?? ''
    this.hash = m[6] ?? ''
    this._searchParams = null
  }

  get host(): string {
    return this.port ? `${this.hostname}:${this.port}` : this.hostname
  }
  get origin(): string {
    return `${this.protocol}//${this.host}`
  }
  get href(): string {
    return `${this.origin}${this.pathname}${this.search}${this.hash}`
  }
  set href(value: string) {
    this._parse(value)
  }
  get searchParams(): URLSearchParams {
    if (!this._searchParams) {
      const params = new URLSearchParams(this.search.replace(/^\?/, ''))
      const self = this
      const origSet = params.set.bind(params)
      const origAppend = params.append.bind(params)
      const origDelete = params.delete.bind(params)
      const sync = () => {
        const str = params.toString()
        self.search = str ? `?${str}` : ''
      }
      params.set = (k, v) => { origSet(k, v); sync() }
      params.append = (k, v) => { origAppend(k, v); sync() }
      params.delete = (k) => { origDelete(k); sync() }
      this._searchParams = params
    }
    return this._searchParams
  }
  toString(): string {
    return this.href
  }
  toJSON(): string {
    return this.href
  }
}

const g = globalThis as any
const isH5 = process.env.TARO_ENV === 'h5'

if (typeof g.Headers === 'undefined') g.Headers = HeadersShim
if (typeof g.Response === 'undefined') g.Response = ResponseShim
if (typeof g.WebSocket === 'undefined') g.WebSocket = WebSocketStub

// URL 包装策略 (weapp):
//   Taro 的内建 URL 覆盖能力有限, 上一次尝试直接 g.URL = URLShim 会被 Taro
//   打包器时重新绑定回来 (URL.name 在 runtime 依然是 "e" 而不是 "URLShim").
//   所以我们不再"替换", 而是"接管": 定义一个 wrapper class, 内部先试 Taro 的原生,
//   失败降到 URLShim, 全失败时把**输入值**塞进错误消息 (原生 URL 只报 "Invalid URL"
//   不带输入, 定位困难).
// URL 现在通过 patches/@tarojs+runtime+4.1.11.patch 直接放宽 Taro 的
// URL polyfill 正则 (原本只认 https?, 拒 wss/ws), 不再需要运行时 shim.
// URLShim 保留为 fallback (H5 用不到).
void URLShim
