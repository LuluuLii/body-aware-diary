import { useEffect, PropsWithChildren } from 'react'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useSettingsStore } from '@/store/useSettingsStore'
import './app.scss'

function App({ children }: PropsWithChildren) {
  const { theme } = useSettingsStore()

  useEffect(() => {
    // 导航栏/背景色 API 仅在小程序端有效，H5 不支持
    if (process.env.TARO_ENV === 'h5') return

    // 动态设置导航栏颜色
    const isFresh = theme === 'fresh'
    Taro.setNavigationBarColor({
      frontColor: isFresh ? '#000000' : '#ffffff',
      backgroundColor: isFresh ? '#F7F5F0' : '#2A2A26',
      animation: { duration: 200, timingFunc: 'easeIn' },
    })

    // 设置页面背景色
    Taro.setBackgroundColor({
      backgroundColor: isFresh ? '#F7F5F0' : '#2A2A26',
    })
  }, [theme])

  // 用 View 包裹所有页面内容，应用主题 class
  return (
    <View className={`theme-${theme}`} style={{ minHeight: '100vh' }}>
      {children}
    </View>
  )
}

export default App
