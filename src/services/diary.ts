import { supabase } from './supabase'
import type { DiaryEntry, DiaryEntryWithAnnotations, CreateEntryInput, CreateAnnotationInput, SearchFilters, BodyAnnotation } from '@/types'
import { PAGE_SIZE } from '@/utils/constants'

export const diaryService = {
  async create(entry: CreateEntryInput, annotations: CreateAnnotationInput[]): Promise<DiaryEntry> {
    const { data: newEntry, error } = await supabase
      .from('diary_entries')
      .insert(entry)
      .select()
      .single()

    if (error) throw error

    if (annotations.length > 0) {
      const { error: annError } = await supabase
        .from('body_annotations')
        .insert(
          annotations.map((a) => ({
            ...a,
            entry_id: newEntry.id,
            user_id: entry.user_id,
          }))
        )
      if (annError) throw annError
    }

    return newEntry as DiaryEntry
  },

  async list(page = 0, pageSize = PAGE_SIZE): Promise<DiaryEntry[]> {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) throw error
    return data as DiaryEntry[]
  },

  async getById(id: string): Promise<DiaryEntryWithAnnotations> {
    const { data: entry, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    const { data: annotations } = await supabase
      .from('body_annotations')
      .select('*')
      .eq('entry_id', id)
      .order('created_at')

    return {
      ...(entry as DiaryEntry),
      annotations: (annotations || []) as BodyAnnotation[],
    }
  },

  async update(id: string, updates: Partial<DiaryEntry>): Promise<DiaryEntry> {
    const { data, error } = await supabase
      .from('diary_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as DiaryEntry
  },

  async updateAnnotations(entryId: string, userId: string, annotations: CreateAnnotationInput[]): Promise<void> {
    // 删除旧的标注再重新插入
    await supabase.from('body_annotations').delete().eq('entry_id', entryId)

    if (annotations.length > 0) {
      const { error } = await supabase
        .from('body_annotations')
        .insert(annotations.map((a) => ({ ...a, entry_id: entryId, user_id: userId })))
      if (error) throw error
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('diary_entries')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    const { error } = await supabase
      .from('diary_entries')
      .update({ is_favorite: isFavorite })
      .eq('id', id)

    if (error) throw error
  },

  async search(filters: SearchFilters, page = 0): Promise<DiaryEntry[]> {
    let query = supabase
      .from('diary_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (filters.query) {
      query = query.or(`title.ilike.%${filters.query}%,content.ilike.%${filters.query}%`)
    }
    if (filters.activity_type) {
      query = query.eq('activity_type', filters.activity_type)
    }
    if (filters.favorites_only) {
      query = query.eq('is_favorite', true)
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    const { data, error } = await query
    if (error) throw error
    return data as DiaryEntry[]
  },
}
