import { useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useDraftStore } from '@/stores/draft.store'
import { useRouter } from '@/app/router'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  Sparkles,
} from 'lucide-react'

export function UserProfilePage() {
  const { user } = useAuth()
  const { userProfile, updateUserProfile, drafts } = useDraftStore()
  const { navigate } = useRouter()

  const [name, setName] = useState(userProfile.name || user?.user_metadata?.full_name || '')
  const [headline, setHeadline] = useState(userProfile.headline || 'LinkedIn Creator & Writer')
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl || user?.user_metadata?.avatar_url || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const publishedCount = drafts.filter((d) => d.status === 'published').length

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveSuccess(false)
    setErrorMessage(null)

    try {
      const updated = {
        name: name.trim() || 'Creator',
        headline: headline.trim() || 'Professional Writer',
        avatarUrl: avatarUrl.trim() || undefined,
      }

      updateUserProfile(updated)

      if (isSupabaseConfigured && user?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: updated.name,
            headline: updated.headline,
            avatar_url: updated.avatarUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (error) {
          throw new Error(error.message)
        }
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => navigate('/app/editor')}
            className="text-muted-foreground hover:text-foreground"
            title="Back to Editor"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Creator Profile</h1>
            <p className="text-xs text-muted-foreground">
              Manage your author identity and how it displays in LinkedIn post previews.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/app/editor')}
          className="gap-1.5 text-xs"
        >
          <Sparkles className="size-3.5" />
          <span>Open Workspace</span>
        </Button>
      </div>

      {/* Account Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-border bg-card space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground">Connected Account</span>
          <p className="text-sm font-bold text-foreground truncate">{user?.email || 'Guest Session'}</p>
          <div className="flex items-center gap-1.5 pt-1">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Google OAuth Verified</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground">Total Drafts</span>
          <p className="text-2xl font-bold text-foreground">{drafts.length}</p>
          <p className="text-[11px] text-muted-foreground">{publishedCount} published to LinkedIn</p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground">Cloud Sync Status</span>
          <div className="flex items-center gap-2 pt-0.5">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px]">
              Active
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">Automated Row-Level Secure replication</p>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <Avatar size="lg" className="size-16 ring-2 ring-primary/20">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="text-base font-bold bg-primary/10 text-primary">
              {name.slice(0, 2).toUpperCase() || 'CR'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <h2 className="text-base font-bold text-foreground">{name || 'Creator'}</h2>
            <p className="text-xs text-muted-foreground line-clamp-1">{headline}</p>
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Profile successfully updated and synced.</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Full Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="text-xs h-9"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Professional Headline</label>
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Founder @ Scale | Writing on AI & Leadership"
              className="text-xs h-9"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Avatar URL</label>
            <Input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="text-xs h-9"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/editor')}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSaving}
            className="gap-2 text-xs"
          >
            <Save className="size-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
