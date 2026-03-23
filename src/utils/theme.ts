import Taro from '@tarojs/taro'

export type ThemeMode = 'fresh' | 'classic'

const THEME_KEY = 'body-diary-theme'

export function getTheme(): ThemeMode {
  try {
    return (Taro.getStorageSync(THEME_KEY) as ThemeMode) || 'fresh'
  } catch {
    return 'fresh'
  }
}

export function setTheme(theme: ThemeMode) {
  try {
    Taro.setStorageSync(THEME_KEY, theme)
  } catch {
    // ignore
  }
}

export const THEME_LABELS: Record<ThemeMode, string> = {
  fresh: '森林晨光',
  classic: '大地深处',
}
