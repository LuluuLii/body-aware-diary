// Taro storage implementation of @body-diary/core `ClientSettingsStore`.
// Backs theme + onboarding_seen in wx.setStorage (小程序) / localStorage (H5).

import Taro from '@tarojs/taro'
import {
  CLIENT_SETTINGS_KEYS,
  type ClientSettingsStore,
  type OnboardingId,
  type Theme,
} from '@body-diary/core'

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = Taro.getStorageSync(key)
    return (raw !== '' && raw !== undefined && raw !== null) ? (raw as T) : fallback
  } catch {
    return fallback
  }
}

function safeSet(key: string, val: unknown): void {
  try {
    Taro.setStorageSync(key, val)
  } catch {
    /* ignore */
  }
}

function getOnboardingSeenList(): OnboardingId[] {
  return safeGet<OnboardingId[]>(CLIENT_SETTINGS_KEYS.onboardingSeen, [])
}

export const taroSettingsStore: ClientSettingsStore = {
  getTheme() {
    return safeGet<Theme>(CLIENT_SETTINGS_KEYS.theme, 'fresh')
  },
  setTheme(theme) {
    safeSet(CLIENT_SETTINGS_KEYS.theme, theme)
  },
  getOnboardingSeen() {
    return getOnboardingSeenList()
  },
  markOnboardingSeen(id) {
    const cur = getOnboardingSeenList()
    if (cur.includes(id)) return
    safeSet(CLIENT_SETTINGS_KEYS.onboardingSeen, [...cur, id])
  },
  resetOnboarding() {
    safeSet(CLIENT_SETTINGS_KEYS.onboardingSeen, [])
  },
}
