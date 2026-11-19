/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type MouseEvent,
} from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react'

interface RouterContextType {
  path: string
  search: string
  hash: string
  navigate: (to: string, options?: { replace?: boolean }) => void
}

const RouterContext = createContext<RouterContextType | null>(null)

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname || '/' : '/'
  )
  const [search, setSearch] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.search || '' : ''
  )
  const [hash, setHash] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.hash || '' : ''
  )

  const updateLocation = useCallback(() => {
    if (typeof window !== 'undefined') {
      setPath(window.location.pathname || '/')
      setSearch(window.location.search || '')
      setHash(window.location.hash || '')
    }
  }, [])

  useEffect(() => {
    window.addEventListener('popstate', updateLocation)
    return () => window.removeEventListener('popstate', updateLocation)
  }, [updateLocation])

  const navigate = useCallback(
    (to: string, options?: { replace?: boolean }) => {
      if (typeof window === 'undefined') return

      if (options?.replace) {
        window.history.replaceState({}, '', to)
      } else {
        window.history.pushState({}, '', to)
      }
      updateLocation()
    },
    [updateLocation]
  )

  return (
    <RouterContext.Provider value={{ path, search, hash, navigate }}>
      {children}
    </RouterContext.Provider>
  )
}

export function useRouter(): RouterContextType {
  const context = useContext(RouterContext)
  if (!context) {
    // Fallback if rendered outside RouterProvider in standalone tests
    return {
      path: typeof window !== 'undefined' ? window.location.pathname || '/' : '/',
      search: typeof window !== 'undefined' ? window.location.search || '' : '',
      hash: typeof window !== 'undefined' ? window.location.hash || '' : '',
      navigate: (to: string, options?: { replace?: boolean }) => {
        if (typeof window !== 'undefined') {
          if (options?.replace) {
            window.history.replaceState({}, '', to)
          } else {
            window.history.pushState({}, '', to)
          }
        }
      },
    }
  }
  return context
}

export function Link({
  href,
  children,
  className,
  title,
  ...props
}: {
  href: string
  children: ReactNode
  className?: string
  title?: string
  [key: string]: unknown
}) {
  const { navigate } = useRouter()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(href)
  }

  return (
    <a href={href} onClick={handleClick} className={className} title={title} {...props}>
      {children}
    </a>
  )
}

/**
 * Route guard requiring an authenticated session.
 * Protects user application routes (/app/*).
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isSuspended, isLoading, user, signOut } = useAuth()
  const { path, navigate } = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (path && path !== '/login' && !path.startsWith('/login')) {
        sessionStorage.setItem('draftin_return_url', path)
        navigate(`/login?returnUrl=${encodeURIComponent(path)}`, { replace: true })
      }
    }
  }, [isLoading, isAuthenticated, path, navigate])

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <LoadingState message="Checking authentication session..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (isSuspended) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background text-foreground">
        <div className="w-full max-w-md p-6 rounded-2xl border border-destructive/20 bg-card shadow-sm space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Account Suspended</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your account (<span className="font-semibold text-foreground">{user?.email}</span>) has been suspended by an administrator. You cannot create, edit, or view private drafts.
            </p>
          </div>
          <div className="pt-2">
            <Button onClick={() => signOut()} variant="outline" className="gap-2 text-xs w-full">
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Route guard requiring authenticated administrator privileges.
 * Protects admin application routes (/admin/*).
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, isSuspended, isLoading, user, signOut } = useAuth()
  const { path, navigate } = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (path && path !== '/login' && !path.startsWith('/login')) {
        sessionStorage.setItem('draftin_return_url', path)
        navigate(`/login?returnUrl=${encodeURIComponent(path)}`, { replace: true })
      }
    }
  }, [isLoading, isAuthenticated, path, navigate])

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <LoadingState message="Verifying administrative credentials..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (isSuspended) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background text-foreground">
        <div className="w-full max-w-md p-6 rounded-2xl border border-destructive/20 bg-card shadow-sm space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Account Suspended</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your administrative access has been revoked due to account suspension.
            </p>
          </div>
          <div className="pt-2">
            <Button onClick={() => signOut()} variant="outline" className="gap-2 text-xs w-full">
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background text-foreground">
        <div className="w-full max-w-md p-6 rounded-2xl border border-destructive/20 bg-card shadow-sm space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Access Restricted</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Administrator privileges required. Account{' '}
              <span className="font-semibold text-foreground">{user?.email}</span> is not authorized
              to access the system admin console.
            </p>
          </div>
          <div className="pt-2">
            <Button onClick={() => navigate('/app', { replace: true })} className="gap-2 text-xs w-full">
              <ArrowLeft className="size-3.5" />
              <span>Return to User Workspace</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
