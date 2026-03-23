import { create } from 'zustand'
import * as authService from '@/services/auth'

interface Profile {
  id: string
  nickname: string | null
  avatar_url: string | null
  llm_provider: string | null
  llm_model: string | null
  llm_api_key: string | null
  llm_base_url: string | null
}

interface AuthState {
  profile: Profile | null
  isLoading: boolean
  isLoggedIn: boolean

  login: () => Promise<void>
  loadProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isLoading: false,
  isLoggedIn: false,

  login: async () => {
    set({ isLoading: true })
    try {
      await authService.wechatLogin()
      const profile = await authService.getProfile()
      set({ profile, isLoggedIn: true })
    } catch (err) {
      console.error('Login failed:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  loadProfile: async () => {
    try {
      const profile = await authService.getProfile()
      if (profile) {
        set({ profile, isLoggedIn: true })
      }
    } catch {
      // not logged in
    }
  },

  updateProfile: async (updates) => {
    const data = await authService.updateProfile(updates)
    set({ profile: data })
  },

  logout: async () => {
    await authService.logout()
    set({ profile: null, isLoggedIn: false })
  },
}))
