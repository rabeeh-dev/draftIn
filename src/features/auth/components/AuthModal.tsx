import { useState } from 'react'
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'
import { Lock, Mail, User, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: 'sign-in' | 'sign-up'
}

export function AuthModal({
  open,
  onOpenChange,
  defaultMode = 'sign-in',
}: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, signInWithOAuth } = useAuth()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      if (mode === 'sign-in') {
        const { error } = await signInWithEmail(email, password)
        if (error) {
          setErrorMessage(error.message)
        } else {
          onOpenChange(false)
        }
      } else {
        const { error } = await signUpWithEmail(email, password, fullName)
        if (error) {
          setErrorMessage(error.message)
        } else {
          setSuccessMessage('Account created! Please check your email to verify your account.')
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOAuth = async (provider: 'linkedin_oidc' | 'google') => {
    setErrorMessage(null)
    const { error } = await signInWithOAuth(provider)
    if (error) setErrorMessage(error.message)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <div className="flex flex-col items-center text-center gap-1.5 pb-2">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xs mb-1">
            <Lock className="size-5" />
          </div>
          <DialogTitle className="text-lg font-bold">
            {mode === 'sign-in' ? 'Welcome Back to draftin' : 'Create Your draftin Account'}
          </DialogTitle>
          <DialogDescription className="text-xs max-w-xs">
            {mode === 'sign-in'
              ? 'Sign in to access your synchronized drafts, custom hooks, and scheduled posts.'
              : 'Join to draft, schedule, and publish high-converting LinkedIn content.'}
          </DialogDescription>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 rounded-lg bg-muted/60 p-1 border border-border/80">
          <button
            type="button"
            onClick={() => {
              setMode('sign-in')
              setErrorMessage(null)
            }}
            className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'sign-in'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('sign-up')
              setErrorMessage(null)
            }}
            className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'sign-up'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Credentials Warning Banner if not configured */}
        {!isSupabaseConfigured && (
          <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Local Demo Mode</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                Add Supabase credentials to <code className="font-mono">.env.local</code> to activate live cloud authentication.
              </p>
            </div>
          </div>
        )}

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs">
            {successMessage}
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'sign-up' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="pl-8 text-xs h-9"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="pl-8 text-xs h-9"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-8 text-xs h-9"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gap-2 mt-1"
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'sign-in' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </Button>
        </form>

        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-background px-2 text-muted-foreground font-semibold">Or continue with</span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOAuth('linkedin_oidc')}
            className="text-xs gap-1.5 h-8.5 hover:border-[#0A66C2]/50 hover:text-[#0A66C2]"
          >
            <span className="font-bold text-[#0A66C2]">in</span>
            <span>LinkedIn</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOAuth('google')}
            className="text-xs gap-1.5 h-8.5"
          >
            <span className="font-bold text-red-500">G</span>
            <span>Google</span>
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  )
}
