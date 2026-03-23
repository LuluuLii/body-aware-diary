import { create } from 'zustand'
import { getTheme, setTheme, type ThemeMode } from '@/utils/theme'

interface SettingsState {
  theme: ThemeMode
  setThemeMode: (theme: ThemeMode) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: getTheme(),

  setThemeMode: (theme) => {
    setTheme(theme)
    set({ theme })
  },
}))
