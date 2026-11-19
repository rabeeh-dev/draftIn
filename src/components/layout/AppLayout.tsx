import type { ReactNode } from 'react'
import { useDraftStore } from '@/stores/draft.store'
import { AppSidebar } from './AppSidebar'
import { DraftList } from '@/features/drafts/components/DraftList'

interface AppLayoutProps {
  children?: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isDraftListOpen } = useDraftStore()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased font-sans">
      {/* 1. Main Navigation Sidebar */}
      <AppSidebar />

      {/* 2. Drafts List Panel (Collapsible / Responsive) */}
      <section
        className={`h-full border-r border-border transition-all duration-300 ease-in-out shrink-0 ${
          isDraftListOpen
            ? 'w-full md:w-68 lg:w-76 flex'
            : 'hidden'
        } ${
          // On mobile, if draft list is open, it takes full width over the editor
          isDraftListOpen ? 'z-20 md:z-0' : ''
        }`}
      >
        <DraftList />
      </section>

      {/* 3. Main Workspace Area (Editor & LinkedIn Preview) */}
      <main
        className={`flex-1 h-full min-w-0 flex flex-col overflow-hidden bg-background ${
          // On mobile, hide workspace if draft list is explicitly open
          isDraftListOpen ? 'hidden md:flex' : 'flex'
        }`}
      >
        {children}
      </main>
    </div>
  )
}
