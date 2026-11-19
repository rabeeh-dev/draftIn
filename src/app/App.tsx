import { useEffect } from 'react'
import { Providers } from './providers'
import { useRouter, AuthGuard, AdminGuard } from './router'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { AppLayout } from '@/components/layout/AppLayout'
import { Editor } from '@/features/editor/components/Editor'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { AuthCallback } from '@/features/auth/components/AuthCallback'
import { AdminPanel } from '@/features/admin/components/AdminPanel'
import { UserProfilePage } from '@/features/user/components/UserProfilePage'
import { UserSettingsPage } from '@/features/user/components/UserSettingsPage'
import { LoadingState } from '@/components/shared/LoadingState'

function AppContent() {
  const { path, navigate } = useRouter()
  const { isAuthenticated, isAdmin, isLoading } = useAuth()

  // 1. Root route: redirect according to auth state
  useEffect(() => {
    if (path === '/') {
      if (!isLoading) {
        if (!isAuthenticated) {
          navigate('/login', { replace: true })
        } else if (isAdmin) {
          navigate('/admin', { replace: true })
        } else {
          navigate('/app', { replace: true })
        }
      }
    }
  }, [path, isAuthenticated, isAdmin, isLoading, navigate])

  // 2. OAuth Callback route
  if (path === '/auth/callback' || path.startsWith('/auth/callback')) {
    return <AuthCallback />
  }

  // 3. Login route
  if (path === '/login') {
    if (isLoading) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-background">
          <LoadingState message="Checking authentication session..." />
        </div>
      )
    }
    if (isAuthenticated) {
      if (isAdmin) {
        navigate('/admin', { replace: true })
      } else {
        navigate('/app', { replace: true })
      }
      return null
    }
    return <LoginPage />
  }

  // 4. Admin route hierarchy (/admin, /admin/users, /admin/activity, /admin/settings)
  if (path === '/admin' || path.startsWith('/admin/')) {
    return (
      <AdminGuard>
        <AdminPanel path={path} />
      </AdminGuard>
    )
  }

  // 5. User application routes (/app, /app/editor, /app/drafts, /app/profile, /app/settings)
  if (path === '/app' || path.startsWith('/app/')) {
    let userView = <Editor />
    if (path === '/app/profile') {
      userView = <UserProfilePage />
    } else if (path === '/app/settings') {
      userView = <UserSettingsPage />
    }

    return (
      <AuthGuard>
        <AppLayout>{userView}</AppLayout>
      </AuthGuard>
    )
  }

  // 6. Root / fallback while redirecting
  if (path === '/') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <LoadingState message="Starting draftin..." />
      </div>
    )
  }

  // 7. Unknown route: fallback
  return (
    <AuthGuard>
      <AppLayout>
        <Editor />
      </AppLayout>
    </AuthGuard>
  )
}

export default function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  )
}
