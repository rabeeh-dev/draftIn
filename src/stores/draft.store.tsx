import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { Draft, DraftFilter, SortOption, UserProfile, SaveStatus } from '@/types'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { draftService } from '@/features/drafts/services/draft.service'

const INITIAL_PROFILE: UserProfile = {
  id: 'user-1',
  name: 'Alex Morgan',
  headline: 'Product Engineer • Building @draftin • TypeScript & React Enthusiast',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  username: 'alexmorgan',
}

interface DraftStoreContextType {
  drafts: Draft[]
  activeDraft: Draft | null
  activeDraftId: string | null
  searchQuery: string
  filter: DraftFilter
  sortBy: SortOption
  isLoading: boolean
  previewDevice: 'mobile' | 'desktop'
  editorLayout: 'split' | 'editor-only' | 'preview-only'
  isSidebarOpen: boolean
  isDraftListOpen: boolean
  saveStatus: SaveStatus
  lastSavedAt: string | null
  syncError: string | null
  isOnline: boolean
  userProfile: UserProfile
  currentView: 'workspace' | 'login' | 'admin'
  setCurrentView: (view: 'workspace' | 'login' | 'admin') => void
  updateUserProfile: (updated: Partial<UserProfile>) => void
  setSaveStatus: (status: SaveStatus) => void
  setLastSavedAt: (timestamp: string | null) => void
  setSyncError: (error: string | null) => void
  retrySync: () => Promise<void>
  // Actions
  setActiveDraftId: (id: string | null) => void
  createDraft: () => string
  updateDraft: (id: string, updates: Partial<Draft>) => void
  deleteDraft: (id: string) => void
  duplicateDraft: (id: string) => void
  toggleStar: (id: string) => void
  setSearchQuery: (query: string) => void
  setFilter: (filter: DraftFilter) => void
  setSortBy: (sort: SortOption) => void
  setPreviewDevice: (device: 'mobile' | 'desktop') => void
  setEditorLayout: (layout: 'split' | 'editor-only' | 'preview-only') => void
  toggleSidebar: () => void
  setIsSidebarOpen: (open: boolean) => void
  toggleDraftList: () => void
  setIsDraftListOpen: (open: boolean) => void
  setIsLoading: (loading: boolean) => void
  fetchDrafts: () => Promise<void>
}

const DraftStoreContext = createContext<DraftStoreContextType | null>(null)

export function DraftStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [drafts, setDrafts] = useState<Draft[]>(() => {
    return draftService.getLocalDrafts()
  })
  const [activeDraftId, setActiveDraftId] = useState<string | null>(() => {
    const local = draftService.getLocalDrafts()
    return local.length > 0 ? local[0].id : null
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<DraftFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('updated_desc')
  const [isLoading, setIsLoading] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop')
  const [editorLayout, setEditorLayout] = useState<'split' | 'editor-only' | 'preview-only'>('split')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isDraftListOpen, setIsDraftListOpen] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_PROFILE)
  const [currentView, setCurrentView] = useState<'workspace' | 'login' | 'admin'>('workspace')

  const updateUserProfile = (updated: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updated }))
  }

  const activeDraft = useMemo(() => {
    return drafts.find((d) => d.id === activeDraftId) || null
  }, [drafts, activeDraftId])

  const fetchDrafts = useCallback(async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const { data, error } = await draftService.fetchDrafts(user.id)
      if (!error && data) {
        setDrafts(data)
        setActiveDraftId((currentId) => {
          if (!currentId || !data.some((d) => d.id === currentId)) {
            return data.length > 0 ? data[0].id : null
          }
          return currentId
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user?.id) return
    let isCancelled = false

    draftService.fetchDrafts(user.id).then(({ data, error }) => {
      if (isCancelled || error || !data) return
      setDrafts(data)
      setActiveDraftId((currentId) => {
        if (!currentId || !data.some((d) => d.id === currentId)) {
          return data.length > 0 ? data[0].id : null
        }
        return currentId
      })
    })

    return () => {
      isCancelled = true
    }
  }, [user])

  // Autosave engine: Debounce changes by 1000ms
  useEffect(() => {
    if (saveStatus !== 'unsaved' || !activeDraft) return

    const timer = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        draftService.saveBackupDraft(activeDraft)
        if (user?.id) {
          const { error } = await draftService.updateDraft(activeDraft.id, activeDraft, user.id)
          if (error) {
            setSaveStatus('error')
            setSyncError(error.message)
            return
          }
        }
        setSaveStatus('saved')
        setLastSavedAt(new Date().toISOString())
        setSyncError(null)
      } catch (err) {
        setSaveStatus('error')
        setSyncError(err instanceof Error ? err.message : 'Save failed')
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [activeDraft, saveStatus, user])

  // Error Recovery: Manual / Automated Sync Retry
  const retrySync = useCallback(async () => {
    if (!activeDraft) return
    setSaveStatus('saving')
    setSyncError(null)

    try {
      draftService.saveBackupDraft(activeDraft)
      if (user?.id) {
        const { error } = await draftService.updateDraft(activeDraft.id, activeDraft, user.id)
        if (error) {
          setSaveStatus('error')
          setSyncError(error.message)
          return
        }
      }
      setSaveStatus('saved')
      setLastSavedAt(new Date().toISOString())
      setSyncError(null)
    } catch (err) {
      setSaveStatus('error')
      setSyncError(err instanceof Error ? err.message : 'Retry failed')
    }
  }, [activeDraft, user])

  // Error Recovery: Network connectivity listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      retrySync()
    }
    const handleOffline = () => {
      setIsOnline(false)
      setSaveStatus('error')
      setSyncError('Network offline. Changes saved locally to device.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [retrySync])

  const createDraft = () => {
    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `draft-${Date.now()}`
    const newDraft: Draft = {
      id: newId,
      title: 'Untitled Draft',
      content: '',
      status: 'draft',
      isStarred: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setDrafts((prev) => {
      const next = [newDraft, ...prev]
      draftService.saveLocalDrafts(next)
      return next
    })
    setActiveDraftId(newId)
    // On mobile, automatically show the editor when creating a draft
    setIsDraftListOpen(false)

    // Sync to Supabase if authenticated
    if (user?.id) {
      draftService.createDraft(newDraft, user.id).catch((err) => {
        console.error('Failed to create cloud draft:', err)
      })
    }

    return newId
  }

  const updateDraft = (id: string, updates: Partial<Draft>) => {
    setDrafts((prev) => {
      const next = prev.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
        }
        return d
      })
      draftService.saveLocalDrafts(next)
      return next
    })
    setSaveStatus('unsaved')
  }

  const deleteDraft = (id: string) => {
    setDrafts((prev) => {
      const remaining = prev.filter((d) => d.id !== id)
      draftService.saveLocalDrafts(remaining)
      if (activeDraftId === id) {
        setActiveDraftId(remaining.length > 0 ? remaining[0].id : null)
      }
      return remaining
    })

    if (user?.id) {
      draftService.deleteDraft(id, user.id).catch((err) => {
        console.error('Failed to delete cloud draft:', err)
      })
    }
  }

  const duplicateDraft = (id: string) => {
    const target = drafts.find((d) => d.id === id)
    if (!target) return
    const duplicateId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `draft-${Date.now()}`
    const duplicated: Draft = {
      ...target,
      id: duplicateId,
      title: `${target.title} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setDrafts((prev) => {
      const next = [duplicated, ...prev]
      draftService.saveLocalDrafts(next)
      return next
    })
    setActiveDraftId(duplicated.id)
  }

  const toggleStar = (id: string) => {
    let targetStarred = false
    setDrafts((prev) => {
      const next = prev.map((d) => {
        if (d.id === id) {
          targetStarred = !d.isStarred
          return { ...d, isStarred: !d.isStarred, updatedAt: new Date().toISOString() }
        }
        return d
      })
      draftService.saveLocalDrafts(next)
      return next
    })

    if (user?.id) {
      draftService.updateDraft(id, { isStarred: targetStarred }, user.id).catch((err) => {
        console.error('Failed to sync star toggle:', err)
      })
    }
  }

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)
  const toggleDraftList = () => setIsDraftListOpen((prev) => !prev)

  const value = {
    drafts,
    activeDraft,
    activeDraftId,
    searchQuery,
    filter,
    sortBy,
    isLoading,
    previewDevice,
    editorLayout,
    isSidebarOpen,
    isDraftListOpen,
    saveStatus,
    lastSavedAt,
    syncError,
    isOnline,
    userProfile,
    currentView,
    setCurrentView,
    updateUserProfile,
    setSaveStatus,
    setLastSavedAt,
    setSyncError,
    retrySync,
    setActiveDraftId,
    createDraft,
    updateDraft,
    deleteDraft,
    duplicateDraft,
    toggleStar,
    setSearchQuery,
    setFilter,
    setSortBy,
    setPreviewDevice,
    setEditorLayout,
    toggleSidebar,
    setIsSidebarOpen,
    toggleDraftList,
    setIsDraftListOpen,
    setIsLoading,
    fetchDrafts,
  }

  return (
    <DraftStoreContext.Provider value={value}>
      {children}
    </DraftStoreContext.Provider>
  )
}

export function useDraftStore() {
  const context = useContext(DraftStoreContext)
  if (!context) {
    throw new Error('useDraftStore must be used within a DraftStoreProvider')
  }
  return context
}
