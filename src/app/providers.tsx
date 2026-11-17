import type { ReactNode } from 'react'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { DraftStoreProvider } from '@/stores/draft.store'
import { TooltipProvider } from '@/components/ui/tooltip'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <DraftStoreProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </DraftStoreProvider>
    </AuthProvider>
  )
}
