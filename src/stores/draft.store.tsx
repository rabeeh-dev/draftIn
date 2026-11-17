import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'
import type { Draft, DraftFilter, SortOption, UserProfile } from '@/types'

const INITIAL_PROFILE: UserProfile = {
  id: 'user-1',
  name: 'Alex Morgan',
  headline: 'Product Engineer • Building @draftin • TypeScript & React Enthusiast',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  username: 'alexmorgan',
}

const INITIAL_DRAFTS: Draft[] = [
  {
    id: 'draft-1',
    title: 'The 1% Rule of Software Engineering',
    content: `Most engineers think seniority is about knowing every framework.\n\nIt’s not.\n\nHere’s what actually separates top 1% engineers from the rest:\n\n1. They delete more code than they write.\n2. They optimize for maintainability, not cleverness.\n3. They understand the business problem before opening the IDE.\n4. They communicate trade-offs with radical clarity.\n\nCode is a liability. Features are assets.\n\nWhat’s the most valuable lesson you learned this year?\n\n#SoftwareEngineering #WebDevelopment #TechCareers #Programming`,
    status: 'draft',
    isStarred: true,
    tags: ['Engineering', 'Career'],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 60000 * 15).toISOString(),
  },
  {
    id: 'draft-2',
    title: 'Why we transitioned to React 19 & Tailwind v4',
    content: `We just shipped our migration to React 19 and Tailwind CSS v4 in production.\n\n3 unexpected benefits we noticed immediately:\n\n→ 40% reduction in styling bundle size with native CSS variables\n→ Zero re-render waterfalls with Base UI primitives\n→ Lightning-fast dev builds with Vite 8\n\nModern web tooling has reached an incredible level of maturity.\n\nAre you planning to upgrade this quarter?\n\n#React #TailwindCSS #WebDev #Frontend`,
    status: 'scheduled',
    isStarred: false,
    tags: ['Tech', 'React'],
    scheduledFor: 'Tomorrow, 9:00 AM',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'draft-3',
    title: '5 non-obvious lessons from building an AI-first editor',
    content: `Building software in 2026 feels completely different.\n\nHere are 5 non-obvious truths about building AI features that users actually stick with:\n\n1. Speed beats perfection. A 200ms heuristic beats a 3-second LLM call.\n2. Invisible AI is better than chat bubbles everywhere.\n3. Context is king — knowing what the user just typed matters more than prompt size.\n4. Guardrails prevent embarrassment.\n5. Let users always have the final keyboard shortcut.\n\nWhat’s your take on embedded AI interfaces?\n\n#ProductDesign #AI #UX #BuildInPublic`,
    status: 'published',
    isStarred: true,
    tags: ['AI', 'Design'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'draft-4',
    title: 'How to write LinkedIn hooks that convert without being cringe',
    content: `Stop starting your posts with "I'm humbled and excited to announce..."\n\nNobody cares about announcements. People care about solutions.\n\nUse this 3-part framework instead:\n\n• The Hook: Point out a painful truth or counter-intuitive insight.\n• The Story: 3 concise bullet points of how you fixed it.\n• The Takeaway: 1 single actionable sentence.\n\nKeep it honest. Keep it punchy.\n\n#ContentStrategy #LinkedInGrowth #CreatorEconomy`,
    status: 'draft',
    isStarred: false,
    tags: ['Marketing', 'Writing'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
]

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
  userProfile: UserProfile
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
}

const DraftStoreContext = createContext<DraftStoreContextType | null>(null)

export function DraftStoreProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Draft[]>(INITIAL_DRAFTS)
  const [activeDraftId, setActiveDraftId] = useState<string | null>('draft-1')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<DraftFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('updated_desc')
  const [isLoading, setIsLoading] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop')
  const [editorLayout, setEditorLayout] = useState<'split' | 'editor-only' | 'preview-only'>('split')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isDraftListOpen, setIsDraftListOpen] = useState(true)
  const [userProfile] = useState<UserProfile>(INITIAL_PROFILE)

  const activeDraft = useMemo(() => {
    return drafts.find((d) => d.id === activeDraftId) || null
  }, [drafts, activeDraftId])

  const createDraft = () => {
    const newId = `draft-${Date.now()}`
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
    setDrafts((prev) => [newDraft, ...prev])
    setActiveDraftId(newId)
    // On mobile, automatically show the editor when creating a draft
    setIsDraftListOpen(false)
    return newId
  }

  const updateDraft = (id: string, updates: Partial<Draft>) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
        }
        return d
      })
    )
  }

  const deleteDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id))
    if (activeDraftId === id) {
      const remaining = drafts.filter((d) => d.id !== id)
      setActiveDraftId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  const duplicateDraft = (id: string) => {
    const target = drafts.find((d) => d.id === id)
    if (!target) return
    const duplicated: Draft = {
      ...target,
      id: `draft-${Date.now()}`,
      title: `${target.title} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setDrafts((prev) => [duplicated, ...prev])
    setActiveDraftId(duplicated.id)
  }

  const toggleStar = (id: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isStarred: !d.isStarred } : d))
    )
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
    userProfile,
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
