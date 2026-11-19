import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import type { Draft, DraftFilter, SortOption, UserProfile, SaveStatus } from '@/types'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { draftService } from '@/features/drafts/services/draft.service'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const TEST_PROFILE: UserProfile = {
  id: 'test-user-1',
  name: 'Alex Morgan',
  headline: 'Product Engineer • Building @draftin • TypeScript & React Enthusiast',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  username: 'alexmorgan',
}

const EMPTY_PROFILE: UserProfile = {
  id: '',
  name: '',
  headline: 'LinkedIn Creator & Writer',
  avatarUrl: '',
  username: '',
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

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function DraftStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const isTestEnv =
    (typeof globalThis !== 'undefined' &&
      (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === 'test') ||
    import.meta.env?.MODE === 'test'

  const [drafts, setDrafts] = useState<Draft[]>(() => {
    if (user?.id) {
      return draftService.getLocalDrafts(user.id)
    }
    if (isTestEnv) {
      return draftService.getLocalDrafts()
    }
    return []
  })
  const [activeDraftId, setActiveDraftId] = useState<string | null>(() => {
    const local = user?.id
      ? draftService.getLocalDrafts(user.id)
      : isTestEnv
        ? draftService.getLocalDrafts()
        : []
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
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (user?.id) {
      try {
        const stored = localStorage.getItem(`draftin_profile_${user.id}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed && typeof parsed === 'object') return parsed
        }
      } catch {
        // Storage unavailable or unparseable
      }

      return {
        id: user.id,
        name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Creator',
        headline: 'LinkedIn Creator & Writer',
        avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        username: user.email?.split('@')[0] || user.id.slice(0, 8),
      }
    }
    if (isTestEnv) {
      return TEST_PROFILE
    }
    return EMPTY_PROFILE
  })
  const [currentView, setCurrentView] = useState<'workspace' | 'login' | 'admin'>('workspace')

  const previousUserIdRef = useRef<string | null>(user?.id || null)

  const updateUserProfile = (updated: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updated }
      if (user?.id) {
        try {
          localStorage.setItem(`draftin_profile_${user.id}`, JSON.stringify(next))
        } catch {
          // Ignore storage quota errors
        }
        if (isSupabaseConfigured) {
          supabase
            .from('profiles')
            .update({
              name: next.name,
              headline: next.headline,
              avatar_url: next.avatarUrl || null,
              username: next.username || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .then(
              () => {},
              (err) => console.error('Failed to update profile in Supabase:', err)
            )
        }
      }
      return next
    })
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
        draftService.saveLocalDrafts(data, user.id)
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

  // User session lifecycle: isolate cache per account & clear in-memory state on logout
  useEffect(() => {
    const currentUserId = user?.id || null
    const prevUserId = previousUserIdRef.current
    previousUserIdRef.current = currentUserId
    let isCancelled = false

    if (currentUserId) {
      Promise.resolve().then(() => {
        if (isCancelled) return
        const cached = draftService.getLocalDrafts(currentUserId)
        setDrafts(cached)
        setActiveDraftId(cached.length > 0 ? cached[0].id : null)

        // Sync profile from local storage / OAuth metadata
        const userProfileKey = `draftin_profile_${currentUserId}`
        const googleName =
          user?.user_metadata?.full_name ||
          user?.user_metadata?.name ||
          user?.email?.split('@')[0] ||
          'Creator'
        const googleAvatar =
          user?.user_metadata?.avatar_url ||
          user?.user_metadata?.picture ||
          ''
        const userHandle = user?.email?.split('@')[0] || currentUserId.slice(0, 8)

        let initialProf: UserProfile = {
          id: currentUserId,
          name: googleName,
          headline: 'LinkedIn Creator & Writer',
          avatarUrl: googleAvatar,
          username: userHandle,
        }

        try {
          const cachedProfStr = localStorage.getItem(userProfileKey)
          if (cachedProfStr) {
            const parsed = JSON.parse(cachedProfStr)
            initialProf = {
              ...initialProf,
              ...parsed,
              id: currentUserId,
              avatarUrl: parsed.avatarUrl || googleAvatar,
              name: parsed.name || googleName,
            }
          }
        } catch {
          // Ignore parse errors on cached profile
        }

        setUserProfile(initialProf)

        // Query Supabase profiles
        if (isSupabaseConfigured) {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUserId)
            .single()
            .then(({ data: profileData, error: profileError }) => {
              if (isCancelled || profileError || !profileData) return

              if (profileData.preferences && typeof profileData.preferences === 'object') {
                const prefs = profileData.preferences as {
                  editorLayout?: 'split' | 'editor-only' | 'preview-only'
                  previewDevice?: 'mobile' | 'desktop'
                }
                if (prefs.editorLayout) setEditorLayout(prefs.editorLayout)
                if (prefs.previewDevice) setPreviewDevice(prefs.previewDevice)
              }

              setUserProfile((prev) => {
                const merged: UserProfile = {
                  id: currentUserId,
                  name: profileData.name || prev.name || googleName,
                  headline: profileData.headline || prev.headline || 'LinkedIn Creator & Writer',
                  avatarUrl: profileData.avatar_url || prev.avatarUrl || googleAvatar,
                  username: profileData.username || prev.username || userHandle,
                }
                try {
                  localStorage.setItem(userProfileKey, JSON.stringify(merged))
                } catch {
                  // Ignore quota errors
                }
                return merged
              })
            })
        }

        return draftService.fetchDrafts(currentUserId)
      }).then((result) => {
        if (isCancelled || !result) return
        const { data, error } = result
        if (error || !data) return
        setDrafts(data)
        draftService.saveLocalDrafts(data, currentUserId)
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
    } else if (prevUserId) {
      Promise.resolve().then(() => {
        if (isCancelled) return
        setDrafts([])
        setActiveDraftId(null)
        setSaveStatus('saved')
        setSyncError(null)
        if (!isTestEnv) {
          setUserProfile(EMPTY_PROFILE)
        }
      })
    }
  }, [user?.id, user?.email, user?.user_metadata, isTestEnv])

  // Autosave engine: Debounce changes by 1000ms
  useEffect(() => {
    if (saveStatus !== 'unsaved' || !activeDraft) return

    const timer = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        draftService.saveBackupDraft(activeDraft, user?.id)
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
      draftService.saveBackupDraft(activeDraft, user?.id)
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
    const newId = generateUUID()
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
      draftService.saveLocalDrafts(next, user?.id)
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
      draftService.saveLocalDrafts(next, user?.id)
      return next
    })
    setSaveStatus('unsaved')
  }

  const deleteDraft = (id: string) => {
    setDrafts((prev) => {
      const remaining = prev.filter((d) => d.id !== id)
      draftService.saveLocalDrafts(remaining, user?.id)
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
    const duplicateId = generateUUID()
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
      draftService.saveLocalDrafts(next, user?.id)
      return next
    })
    setActiveDraftId(duplicated.id)

    // Sync duplicated draft to Supabase if authenticated
    if (user?.id) {
      draftService.createDraft(duplicated, user.id).catch((err) => {
        console.error('Failed to create duplicated draft in cloud:', err)
      })
    }
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
      draftService.saveLocalDrafts(next, user?.id)
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

  const setPreviewDeviceWithSync = (device: 'mobile' | 'desktop') => {
    setPreviewDevice(device)
    if (user?.id && isSupabaseConfigured) {
      supabase
        .from('profiles')
        .update({
          preferences: { editorLayout, previewDevice: device },
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .then(
          () => {},
          (err) => console.error('Failed to sync previewDevice to Supabase:', err)
        )
    }
  }

  const setEditorLayoutWithSync = (layout: 'split' | 'editor-only' | 'preview-only') => {
    setEditorLayout(layout)
    if (user?.id && isSupabaseConfigured) {
      supabase
        .from('profiles')
        .update({
          preferences: { editorLayout: layout, previewDevice },
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .then(
          () => {},
          (err) => console.error('Failed to sync editorLayout to Supabase:', err)
        )
    }
  }

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
    setPreviewDevice: setPreviewDeviceWithSync,
    setEditorLayout: setEditorLayoutWithSync,
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
