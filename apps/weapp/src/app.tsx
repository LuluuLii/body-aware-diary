// polyfills 必须在 supabase / taroFetch 被任何模块 import 之前先跑,
// 否则 `new Headers()` / `new Response()` 引用会先解析成 undefined.
import './lib/polyfills'

import { PropsWithChildren, useEffect } from 'react'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getPalette } from '@body-diary/design-tokens'
import { useAppStore } from './store/useAppStore'
import './app.scss'

// H5 runtime px→vw transform. Matches config/index.ts H5 postcss config.
if (process.env.TARO_ENV === 'h5') {
  Taro.initPxTransform({
    designWidth: 390,
    deviceRatio: { 390: 1, 375: 375 / 390, 750: 750 / 390 },
    targetUnit: 'vw',
  })
}

function App({ children }: PropsWithChildren) {
  const theme = useAppStore((s) => s.theme)
  const loadUserPoses = useAppStore((s) => s.loadUserPoses)

  useEffect(() => {
    // App-level 一次性加载 user_poses 缓存 · v2.7-B
    loadUserPoses()
  }, [loadUserPoses])

  useEffect(() => {
    // 导航栏/背景色 API 仅小程序端有效，H5 走 CSS 变量
    if (process.env.TARO_ENV === 'h5') return
    const palette = getPalette(theme)
    Taro.setNavigationBarColor({
      frontColor: theme === 'fresh' ? '#000000' : '#ffffff',
      backgroundColor: palette.paperBg,
      animation: { duration: 200, timingFunc: 'easeIn' },
    })
    Taro.setBackgroundColor({ backgroundColor: palette.paperBg })
  }, [theme])

  return (
    <View className={`theme-${theme}`} style={{ minHeight: '100vh' }}>
      {children}
    </View>
  )
}

export default App
