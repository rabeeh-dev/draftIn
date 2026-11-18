import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Feather,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Cloud,
  AlertCircle,
  Loader2,
  LogOut,
  Sparkles,
} from 'lucide-react'

interface LoginPageProps {
  onBack?: () => void
}

export function LoginPage({ onBack }: LoginPageProps) {
  const { user, isAuthenticated, signInWithGoogle, signOut } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setErrorMessage(null)
    setIsSigningIn(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setErrorMessage(error.message)
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Google authentication failed.')
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#0A66C2]/10 blur-3xl pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="h-16 w-full border-b border-border/80 px-4 md:px-8 flex items-center justify-between backdrop-blur-md bg-background/80 sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <Feather className="size-4.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight">draftin</span>
            <Badge variant="secondary" className="text-[10px] font-medium px-1.5 py-0">
              Auth Studio
            </Badge>
          </div>
        </div>

        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Workspace</span>
          </Button>
        )}
      </header>

      {/* Main Authentication Section */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Card Container */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm backdrop-blur-xs relative space-y-6">
            {/* Header info */}
            <div className="text-center space-y-2">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#0A66C2]/10 text-[#0A66C2] mb-3">
                <ShieldCheck className="size-6" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                {isAuthenticated ? 'Authenticated Account' : 'Sign in to draftin'}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {isAuthenticated
                  ? 'Your account is connected to Supabase cloud sync.'
                  : 'Fast, secure Google single sign-on. No passwords to remember or reset.'}
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-in fade-in-50">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span className="flex-1 leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* If Supabase is not configured notice */}
            {!isSupabaseConfigured && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span className="flex-1 leading-snug">
                  Supabase local credentials are not detected. Add your credentials in <code className="font-mono text-[11px]">.env.local</code> to enable live OAuth redirects.
                </span>
              </div>
            )}

            {/* Authenticated State */}
            {isAuthenticated ? (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-muted/30">
                  <Avatar size="default" className="size-11 ring-1 ring-border">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name || 'User'} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                      {(user?.email?.[0] || 'U').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden text-left">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-xs text-foreground truncate">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                      </p>
                      <Badge variant="outline" className="text-[10px] py-0 px-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        Active
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {onBack && (
                    <Button onClick={onBack} size="sm" className="gap-1.5 font-semibold text-xs">
                      <span>Open Workspace</span>
                      <Sparkles className="size-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut()}
                    className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="size-3.5" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </div>
            ) : (
              /* Unauthenticated Google-Only Login Action */
              <div className="space-y-4 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={isSigningIn}
                  onClick={handleGoogleLogin}
                  className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-border/80 bg-background hover:bg-muted/50 hover:border-border font-semibold text-sm transition-all shadow-xs cursor-pointer group"
                >
                  {isSigningIn ? (
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  ) : (
                    /* Official Google G Logo SVG */
                    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </Button>

                <p className="text-[11px] text-center text-muted-foreground/80 leading-relaxed px-2">
                  By clicking Continue, you authenticate with your Google account through Supabase OAuth.
                </p>
              </div>
            )}

            {/* Feature Highlights Grid */}
            <div className="pt-4 border-t border-border/80 grid grid-cols-1 gap-2.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2.5">
                <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Zap className="size-3.5" />
                </div>
                <span>1-Click sign-in with your existing Google account</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Cloud className="size-3.5" />
                </div>
                <span>Automatic cloud draft syncing & offline backup</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex size-6 items-center justify-center rounded-lg bg-[#0A66C2]/10 text-[#0A66C2] shrink-0">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <span>One-click publishing handoff to LinkedIn</span>
              </div>
            </div>
          </div>

          {/* Bottom Guest Mode option */}
          {!isAuthenticated && onBack && (
            <div className="text-center">
              <button
                type="button"
                onClick={onBack}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer transition-colors"
              >
                Continue in guest mode without signing in
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-muted-foreground border-t border-border/60">
        draftin © 2026 • High-Conversion LinkedIn Post Studio
      </footer>
    </div>
  )
}
