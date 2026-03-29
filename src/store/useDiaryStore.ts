import { create } from 'zustand'
import { diaryService } from '@/services/diary'
import type { DiaryEntry, DiaryEntryWithAnnotations, CreateEntryInput, CreateAnnotationInput, SearchFilters } from '@/types'

interface DiaryState {
  entries: DiaryEntry[]
  currentEntry: DiaryEntryWithAnnotations | null
  isLoading: boolean
  hasMore: boolean
  page: number

  fetchEntries: () => Promise<void>
  fetchMore: () => Promise<void>
  getEntry: (id: string) => Promise<void>
  createEntry: (entry: CreateEntryInput, annotations: CreateAnnotationInput[]) => Promise<string>
  updateEntry: (id: string, updates: Partial<DiaryEntry>, annotations?: CreateAnnotationInput[]) => Promise<void>
  appendSorenessAnnotations: (entryId: string, userId: string, annotations: CreateAnnotationInput[]) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  searchEntries: (filters: SearchFilters) => Promise<DiaryEntry[]>
  clearCurrent: () => void
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  entries: [],
  currentEntry: null,
  isLoading: false,
  hasMore: true,
  page: 0,

  fetchEntries: async () => {
    set({ isLoading: true, page: 0 })
    try {
      const entries = await diaryService.list(0)
      set({ entries, hasMore: entries.length >= 20, page: 0 })
    } catch (err) {
      console.error('Failed to fetch entries:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchMore: async () => {
    const { page, hasMore, isLoading, entries } = get()
    if (!hasMore || isLoading) return

    set({ isLoading: true })
    try {
      const nextPage = page + 1
      const more = await diaryService.list(nextPage)
      set({
        entries: [...entries, ...more],
        hasMore: more.length >= 20,
        page: nextPage,
      })
    } catch (err) {
      console.error('Failed to fetch more:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  getEntry: async (id) => {
    set({ isLoading: true })
    try {
      const entry = await diaryService.getById(id)
      set({ currentEntry: entry })
    } catch (err) {
      console.error('Failed to get entry:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  createEntry: async (entry, annotations) => {
    const newEntry = await diaryService.create(entry, annotations)
    set((state) => ({ entries: [newEntry, ...state.entries] }))
    return newEntry.id
  },

  updateEntry: async (id, updates, annotations) => {
    const updated = await diaryService.update(id, updates)
    if (annotations) {
      await diaryService.updateAnnotations(id, updated.user_id, annotations)
    }
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? updated : e)),
      currentEntry: state.currentEntry?.id === id
        ? { ...updated, annotations: state.currentEntry.annotations }
        : state.currentEntry,
    }))
  },

  appendSorenessAnnotations: async (entryId, userId, annotations) => {
    await diaryService.appendAnnotations(entryId, userId, annotations)
    // Refresh currentEntry annotations if it's the same entry
    set((state) => {
      if (state.currentEntry?.id !== entryId) return {}
      return {
        currentEntry: {
          ...state.currentEntry,
          annotations: [
            ...state.currentEntry.annotations,
            // optimistic: cast to BodyAnnotation shape (id/created_at will be filled on next load)
            ...annotations.map((a, i) => ({
              ...a,
              id: `optimistic-${i}`,
              entry_id: entryId,
              user_id: userId,
              side: a.side || 'front' as const,
              note: a.note || null,
              soreness_recorded_at: a.soreness_recorded_at || null,
              created_at: new Date().toISOString(),
            })),
          ],
        },
      }
    })
  },

  deleteEntry: async (id) => {
    await diaryService.delete(id)
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
      currentEntry: state.currentEntry?.id === id ? null : state.currentEntry,
    }))
  },

  toggleFavorite: async (id) => {
    const { entries } = get()
    const entry = entries.find((e) => e.id === id)
    if (!entry) return

    const newFav = !entry.is_favorite
    await diaryService.toggleFavorite(id, newFav)
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, is_favorite: newFav } : e
      ),
    }))
  },

  searchEntries: async (filters) => {
    return diaryService.search(filters)
  },

  clearCurrent: () => set({ currentEntry: null }),
}))
