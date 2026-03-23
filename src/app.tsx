import { useEffect, PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'
import { useSettingsStore } from '@/store/useSettingsStore'
import './app.scss'

function App({ children }: PropsWithChildren) {
  const { theme } = useSettingsStore()

  useEffect(() => {
    // 应用主题 class 到 page 元素
    const applyTheme = () => {
      Taro.nextTick(() => {
        const pages = Taro.getCurrentPages()
        const current = pages[pages.length - 1]
        if (current) {
          // 通过设置页面 class 来切换主题
          Taro.setNavigationBarColor({
            frontColor: theme === 'classic' ? '#ffffff' : '#000000',
            backgroundColor: theme === 'classic' ? '#2A2A26' : '#F7F5F0',
            animation: { duration: 300, timingFunc: 'easeIn' },
          })
        }
      })
    }
    applyTheme()
  }, [theme])

  return children
}

export default App
