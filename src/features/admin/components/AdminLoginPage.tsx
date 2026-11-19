import { useState, useEffect, type FormEvent } from 'react'
import { adminAuthService } from '../services/admin-auth.service'
import { useRouter } from '@/app/router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  KeyRound,
} from 'lucide-react'

interface AdminLoginPageProps {
  onSuccess?: () => void
}

export function AdminLoginPage({ onSuccess }: AdminLoginPageProps = {}) {
  const { navigate, path } = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // If already authenticated on mount, invoke onSuccess and ensure navigation
  useEffect(() => {
    if (adminAuthService.isAuthenticated()) {
      onSuccess?.()
      if (path !== '/admin') {
        navigate('/admin', { replace: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    const result = adminAuthService.login(username, password)
    setIsSubmitting(false)

    if (result.success) {
      onSuccess?.()
      if (path !== '/admin') {
        navigate('/admin', { replace: true })
      }
    } else {
      setErrorMessage(result.error || 'Authentication failed. Please verify credentials.')
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background text-foreground relative overflow-hidden">
      {/* Background Decorative Gradient */}
      <div className="absolute inset-0 bg-radial-[at_50%_0%] from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header / Brand */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="size-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Admin Console</h1>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Dedicated administration portal. Enter your administrator username and password to
            manage users and inspect platform activity.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xs space-y-5">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="admin-username"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <User className="size-3.5 text-muted-foreground" />
                <span>Administrator Username</span>
              </label>
              <Input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                required
                autoComplete="username"
                autoFocus
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <Lock className="size-3.5 text-muted-foreground" />
                <span>Administrator Password</span>
              </label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  required
                  autoComplete="current-password"
                  className="text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full gap-2 text-xs font-semibold mt-2"
            >
              <KeyRound className="size-3.5" />
              <span>{isSubmitting ? 'Verifying...' : 'Sign In as Administrator'}</span>
            </Button>
          </form>

          <div className="pt-2 border-t border-border/80 text-center">
            <button
              type="button"
              onClick={() => navigate('/app')}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Return to Writer Workspace</span>
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-[11px] text-center text-muted-foreground">
          Protected administrative system. Unauthorized access attempts are monitored and recorded.
        </p>
      </div>
    </div>
  )
}
