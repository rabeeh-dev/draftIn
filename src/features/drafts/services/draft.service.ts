import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Draft } from '../types/draft.types'
import type { Database } from '@/types/database.types'

type DraftRow = Database['public']['Tables']['drafts']['Row']

const LOCAL_STORAGE_KEY = 'draftin_drafts_v1'
const LOCAL_BACKUP_KEY = 'draftin_offline_backup'

// Transform Supabase DB Row to Frontend Draft Model
export function mapRowToDraft(row: DraftRow): Draft {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    status: row.status,
    isStarred: row.is_starred,
    tags: Array.isArray(row.tags) ? row.tags : [],
    scheduledFor: row.scheduled_for ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Transform Frontend Draft Model to Supabase DB Insert/Update
export function mapDraftToRow(draft: Draft, userId: string) {
  return {
    id: draft.id,
    user_id: userId,
    title: draft.title,
    content: draft.content,
    status: draft.status,
    is_starred: draft.isStarred,
    tags: draft.tags,
    scheduled_for: draft.scheduledFor ?? null,
    updated_at: draft.updatedAt,
  }
}

export const draftService = {
  // Local storage management
  getLocalDrafts(): Draft[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (data) {
        return JSON.parse(data)
      }
    } catch {
      // Local storage disabled or corrupted
    }
    return []
  },

  saveLocalDrafts(drafts: Draft[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(drafts))
    } catch {
      // Ignore quota errors
    }
  },

  saveBackupDraft(draft: Draft): void {
    try {
      const current = localStorage.getItem(LOCAL_BACKUP_KEY)
      const list: Draft[] = current ? JSON.parse(current) : []
      const updated = [draft, ...list.filter((d) => d.id !== draft.id)].slice(0, 50)
      localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(updated))
    } catch {
      // Ignore quota errors
    }
  },

  getBackupDrafts(): Draft[] {
    try {
      const current = localStorage.getItem(LOCAL_BACKUP_KEY)
      return current ? JSON.parse(current) : []
    } catch {
      return []
    }
  },

  // 1. Create Draft
  async createDraft(draft: Draft, userId?: string): Promise<{ data: Draft | null; error: Error | null }> {
    // Always persist to local cache first
    this.saveBackupDraft(draft)

    if (!isSupabaseConfigured || !userId) {
      return { data: draft, error: null }
    }

    try {
      const { data, error } = await supabase
        .from('drafts')
        .insert({
          id: draft.id,
          user_id: userId,
          title: draft.title,
          content: draft.content,
          status: draft.status,
          is_starred: draft.isStarred,
          tags: draft.tags,
          scheduled_for: draft.scheduledFor ?? null,
        })
        .select()
        .single()

      if (error) {
        return { data: draft, error: new Error(error.message) }
      }

      return { data: mapRowToDraft(data), error: null }
    } catch (err) {
      return { data: draft, error: err instanceof Error ? err : new Error('Network error creating draft') }
    }
  },

  // 2. Fetch Drafts
  async fetchDrafts(userId?: string): Promise<{ data: Draft[]; error: Error | null }> {
    if (!isSupabaseConfigured || !userId) {
      const local = this.getLocalDrafts()
      return { data: local, error: null }
    }

    try {
      const { data, error } = await supabase
        .from('drafts')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) {
        const local = this.getLocalDrafts()
        return { data: local, error: new Error(error.message) }
      }

      const drafts = (data ?? []).map(mapRowToDraft)
      this.saveLocalDrafts(drafts)
      return { data: drafts, error: null }
    } catch (err) {
      const local = this.getLocalDrafts()
      return {
        data: local,
        error: err instanceof Error ? err : new Error('Failed to fetch drafts from Supabase'),
      }
    }
  },

  // 3. Edit / Update Draft
  async updateDraft(id: string, updates: Partial<Draft>, userId?: string): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured || !userId) {
      return { error: null }
    }

    try {
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }
      if (updates.title !== undefined) updatePayload.title = updates.title
      if (updates.content !== undefined) updatePayload.content = updates.content
      if (updates.status !== undefined) updatePayload.status = updates.status
      if (updates.isStarred !== undefined) updatePayload.is_starred = updates.isStarred
      if (updates.tags !== undefined) updatePayload.tags = updates.tags
      if (updates.scheduledFor !== undefined) updatePayload.scheduled_for = updates.scheduledFor

      const { error } = await supabase
        .from('drafts')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', userId)

      if (error) {
        return { error: new Error(error.message) }
      }
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Network error updating draft') }
    }
  },

  // 4. Delete Draft
  async deleteDraft(id: string, userId?: string): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured || !userId) {
      return { error: null }
    }

    try {
      const { error } = await supabase
        .from('drafts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) {
        return { error: new Error(error.message) }
      }
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Network error deleting draft') }
    }
  },

  // 5. Error Recovery & Batch Sync
  async syncPendingDrafts(pendingDrafts: Draft[], userId?: string): Promise<{ syncedCount: number; error: Error | null }> {
    if (!isSupabaseConfigured || !userId || pendingDrafts.length === 0) {
      return { syncedCount: 0, error: null }
    }

    let syncedCount = 0
    try {
      for (const draft of pendingDrafts) {
        const payload = mapDraftToRow(draft, userId)
        const { error } = await supabase.from('drafts').upsert(payload)
        if (!error) syncedCount++
      }
      return { syncedCount, error: null }
    } catch (err) {
      return {
        syncedCount,
        error: err instanceof Error ? err : new Error('Batch sync failed'),
      }
    }
  },
}
