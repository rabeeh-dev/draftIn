import type { ReactNode } from 'react'
import { DraftStoreProvider } from '@/stores/draft.store'
import { TooltipProvider } from '@/components/ui/tooltip'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <DraftStoreProvider>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </DraftStoreProvider>
  )
}
