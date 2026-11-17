export type DraftStatus = 'draft' | 'scheduled' | 'published'

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

export interface Draft {
  id: string
  title: string
  content: string
  status: DraftStatus
  isStarred: boolean
  tags: string[]
  scheduledFor?: string
  createdAt: string
  updatedAt: string
}

export type DraftFilter = 'all' | 'draft' | 'scheduled' | 'published' | 'starred'
export type SortOption = 'updated_desc' | 'updated_asc' | 'title_asc'
