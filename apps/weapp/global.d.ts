declare module '*.png'
declare module '*.gif'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.svg'
declare module '*.css'
declare module '*.less'
declare module '*.scss'
declare module '*.sass'
declare module '*.styl'

declare namespace NodeJS {
  interface ProcessEnv {
    TARO_ENV:
      | 'weapp'
      | 'swan'
      | 'alipay'
      | 'h5'
      | 'rn'
      | 'tt'
      | 'quickapp'
      | 'qq'
      | 'jd'
    SUPABASE_URL: string
    SUPABASE_ANON_KEY: string
  }
}

// Taro/webpack defineConstants 注入的 process.env 在 build time 被替换成字面量；
// 声明全局 process 让 TypeScript 不报 "Cannot find name 'process'"。
declare const process: {
  env: NodeJS.ProcessEnv
}
