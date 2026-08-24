// Custom bottom TabBar. Handoff layout: 悬浮圆角卡片 4 tabs + 中央大 + 悬浮按钮.
// 每个页面自己 render 这个组件；app.config.ts 不注册内置 tabBar.

import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import {
  IconHome,
  IconReview,
  IconPoses,
  IconDiary,
  IconPlus,
} from '../../lib/icons'
import './index.scss'

export type TabKey = 'home' | 'review' | 'poses' | 'diary'

const TAB_ROUTES: Record<TabKey, string> = {
  home:   '/pages/home/index',
  review: '/pages/review/index',
  poses:  '/pages/poses/index',
  diary:  '/pages/diary/index',
}

interface TabBarProps {
  /** Currently active tab, or null (e.g. on Record page). */
  active: TabKey | null
}

// 图标编译成 SVG data URL 用 <Image> 渲染 (weapp WXML 不认 <svg>),
// data URL 里的 SVG 拿不到 CSS variable, 只能传具体色值.
// 森林晨光主题: ink #33382E, text-tertiary #9A9578, green-text #F3EEDF.
// TODO: 深色主题 (theme-earth) 时切换成对应 hex, 目前 POC 只支持 fresh.
const ACTIVE = '#33382E'
const INACTIVE = '#9A9578'
const PLUS_COLOR = '#F3EEDF'

export function TabBar({ active }: TabBarProps) {
  const goTab = (key: TabKey) => {
    if (key === active) return
    Taro.reLaunch({ url: TAB_ROUTES[key] })
  }
  const openRecord = () => {
    Taro.reLaunch({ url: '/pages/record/index' })
  }

  return (
    <View className='tab-bar-container'>
      <View className='tab-bar'>
        <View className='tab-cell' onClick={() => goTab('home')}>
          <IconHome size={19} color={active === 'home' ? ACTIVE : INACTIVE} />
          <Text className={`tab-label ${active === 'home' ? 'active' : ''}`}>首页</Text>
        </View>
        <View className='tab-cell' onClick={() => goTab('review')}>
          <IconReview size={18} color={active === 'review' ? ACTIVE : INACTIVE} />
          <Text className={`tab-label ${active === 'review' ? 'active' : ''}`}>回顾</Text>
        </View>
        <View className='tab-cell tab-cell-spacer' />
        <View className='tab-cell' onClick={() => goTab('poses')}>
          <IconPoses size={19} color={active === 'poses' ? ACTIVE : INACTIVE} />
          <Text className={`tab-label ${active === 'poses' ? 'active' : ''}`}>图鉴</Text>
        </View>
        <View className='tab-cell' onClick={() => goTab('diary')}>
          <IconDiary size={18} color={active === 'diary' ? ACTIVE : INACTIVE} />
          <Text className={`tab-label ${active === 'diary' ? 'active' : ''}`}>日记本</Text>
        </View>
      </View>
      <View className='tab-plus' onClick={openRecord}>
        <IconPlus size={28} color={PLUS_COLOR} />
      </View>
    </View>
  )
}
