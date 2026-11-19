export type DraftStatus = 'draft' | 'scheduled' | 'published'

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

export interface DraftVersion {
  id: string
  draftId: string
  userId: string
  versionNumber: number
  title: string
  content: string
  contentJson?: Record<string, unknown> | null
  createdAt: string
}

export interface Draft {
  id: string
  title: string
  content: string
  contentJson?: Record<string, unknown> | null
  version?: number
  deletedAt?: string | null
  lastSavedAt?: string | null
  status: DraftStatus
  isStarred: boolean
  tags: string[]
  scheduledFor?: string
  createdAt: string
  updatedAt: string
}

export type DraftFilter = 'all' | 'draft' | 'scheduled' | 'published' | 'starred'
export type SortOption = 'updated_desc' | 'updated_asc' | 'title_asc'
