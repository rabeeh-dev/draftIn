import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useRouter } from '@/app/router'
import { validateRedirectUrl } from '@/lib/security'
import { Button } from '@/components/ui/button'
import { Feather, AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react'

export function AuthCallback() {
  const { navigate } = useRouter()
  const { user, isAdmin, isLoading } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const searchParams = new URLSearchParams(window.location.search)
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash
    const hashParams = new URLSearchParams(hash)

    const error =
      searchParams.get('error_description') ||
      searchParams.get('error') ||
      hashParams.get('error_description') ||
      hashParams.get('error')

    return error ? decodeURIComponent(error) : null
  })

  useEffect(() => {
    if (errorMessage) return

    // Extract returnUrl and validate strictly
    const searchParams = new URLSearchParams(window.location.search)
    const rawReturnUrl =
      searchParams.get('returnUrl') || sessionStorage.getItem('draftin_return_url')
    const safeReturnUrl = rawReturnUrl ? validateRedirectUrl(rawReturnUrl, '/app') : null

    // Complete session exchange
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) {
        setErrorMessage(sessionError.message)
        return
      }

      if (data.session) {
        // Clear stored return URL
        sessionStorage.removeItem('draftin_return_url')

        // Route strictly by server claims
        const resolvedUser = data.session.user
        const isUserAdmin =
          resolvedUser.app_metadata?.role === 'admin' ||
          resolvedUser.app_metadata?.is_admin === true

        if (isUserAdmin) {
          if (safeReturnUrl && safeReturnUrl.startsWith('/admin')) {
            navigate(safeReturnUrl, { replace: true })
          } else {
            navigate('/admin', { replace: true })
          }
        } else {
          if (safeReturnUrl && safeReturnUrl.startsWith('/app')) {
            navigate(safeReturnUrl, { replace: true })
          } else {
            navigate('/app', { replace: true })
          }
        }
      }
    })
  }, [errorMessage, navigate])

  // Also react if AuthContext resolves session
  useEffect(() => {
    if (!errorMessage && !isLoading && user) {
      const searchParams = new URLSearchParams(window.location.search)
      const rawReturnUrl =
        searchParams.get('returnUrl') || sessionStorage.getItem('draftin_return_url')
      const safeReturnUrl = rawReturnUrl ? validateRedirectUrl(rawReturnUrl, '/app') : null
      sessionStorage.removeItem('draftin_return_url')

      if (isAdmin) {
        if (safeReturnUrl && safeReturnUrl.startsWith('/admin')) {
          navigate(safeReturnUrl, { replace: true })
        } else {
          navigate('/admin', { replace: true })
        }
      } else {
        if (safeReturnUrl && safeReturnUrl.startsWith('/app')) {
          navigate(safeReturnUrl, { replace: true })
        } else {
          navigate('/app', { replace: true })
        }
      }
    }
  }, [user, isAdmin, isLoading, errorMessage, navigate])

  if (errorMessage) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background text-foreground">
        <div className="w-full max-w-md p-6 rounded-2xl border border-destructive/20 bg-card shadow-sm space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Authentication Failed</h2>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/5 text-destructive text-xs text-left">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
          <Button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full gap-2 text-xs"
          >
            <ArrowLeft className="size-3.5" />
            <span>Return to Sign In</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-background text-foreground">
      <div className="flex flex-col items-center space-y-4 max-w-xs text-center">
        <div className="relative flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xs animate-pulse">
          <Feather className="size-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-foreground">Verifying Google Account</h2>
          <p className="text-xs text-muted-foreground">
            Setting up your secure writing studio and restoring cloud drafts...
          </p>
        </div>
        <div className="flex items-center gap-1.5 pt-2">
          <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <span className="size-2 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
    </div>
  )
}
