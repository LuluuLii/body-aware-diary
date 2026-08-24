// Global app state (Zustand) — theme + onboarding-seen tips + user_poses cache.

import { create } from 'zustand'
import { listUserPoses, type OnboardingId, type Theme, type UserPose } from '@body-diary/core'
import { taroSettingsStore } from '../lib/settingsStore'
import { getSupabase, ensureAnonymousSession } from '../lib/supabase'

interface AppState {
  theme: Theme
  onboardingSeen: OnboardingId[]
  /** v2.7-B · 用户自建 pose 缓存 · 全局 lookup 时避免每处都发 supabase 请求 */
  userPoses: UserPose[]
  userPosesLoaded: boolean
  setTheme: (theme: Theme) => void
  markOnboardingSeen: (id: OnboardingId) => void
  resetOnboarding: () => void
  /** 首次调用会拉 supabase；已加载过则短路返回。传 force=true 强制刷新（保存后调用）*/
  loadUserPoses: (force?: boolean) => Promise<void>
  /** 本地 upsert（保存新的 pose 后立即注入缓存，避免等下次 loadUserPoses）*/
  addUserPoseLocal: (pose: UserPose) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: taroSettingsStore.getTheme(),
  onboardingSeen: taroSettingsStore.getOnboardingSeen(),
  userPoses: [],
  userPosesLoaded: false,
  setTheme: (theme) => {
    taroSettingsStore.setTheme(theme)
    set({ theme })
  },
  markOnboardingSeen: (id) => {
    taroSettingsStore.markOnboardingSeen(id)
    set({ onboardingSeen: taroSettingsStore.getOnboardingSeen() })
  },
  resetOnboarding: () => {
    taroSettingsStore.resetOnboarding()
    set({ onboardingSeen: [] })
  },
  loadUserPoses: async (force = false) => {
    if (!force && get().userPosesLoaded) return
    try {
      const session = await ensureAnonymousSession()
      if (!session) return
      const client = getSupabase()
      const list = await listUserPoses(client, session.user.id)
      set({ userPoses: list, userPosesLoaded: true })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[appStore] loadUserPoses failed', err)
    }
  },
  addUserPoseLocal: (pose) => {
    set((s) => ({ userPoses: [pose, ...s.userPoses], userPosesLoaded: true }))
  },
}))
