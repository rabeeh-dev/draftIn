import { Providers } from './providers'
import { AppLayout } from '@/components/layout/AppLayout'
import { Editor } from '@/features/editor/components/Editor'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { useDraftStore } from '@/stores/draft.store'

function AppContent() {
  const { currentView, setCurrentView } = useDraftStore()

  if (currentView === 'login') {
    return <LoginPage onBack={() => setCurrentView('workspace')} />
  }

  return (
    <AppLayout>
      <Editor />
    </AppLayout>
  )
}

export default function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  )
}
