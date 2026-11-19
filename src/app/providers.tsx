import type { ReactNode } from 'react'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { RouterProvider } from './router'
import { DraftStoreProvider } from '@/stores/draft.store'
import { TooltipProvider } from '@/components/ui/tooltip'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <RouterProvider>
        <DraftStoreProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </DraftStoreProvider>
      </RouterProvider>
    </AuthProvider>
  )
}
