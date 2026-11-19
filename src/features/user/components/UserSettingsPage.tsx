import { useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useDraftStore } from '@/stores/draft.store'
import { useRouter } from '@/app/router'
import { draftService } from '@/features/drafts/services/draft.service'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  ArrowLeft,
  Trash2,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Laptop,
  Smartphone,
  Download,
  UserX,
} from 'lucide-react'

export function UserSettingsPage() {
  const { user, signOut } = useAuth()
  const { drafts, userProfile, previewDevice, setPreviewDevice, editorLayout, setEditorLayout } =
    useDraftStore()
  const { navigate } = useRouter()
  const [clearedMessage, setClearedMessage] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleClearCache = () => {
    if (user?.id) {
      draftService.clearUserDrafts(user.id)
      setClearedMessage(true)
      setTimeout(() => setClearedMessage(false), 3000)
    }
  }

  const handleExportData = () => {
    setIsExporting(true)
    try {
      const exportPayload = {
        exportDate: new Date().toISOString(),
        profile: userProfile,
        draftsCount: drafts.length,
        drafts: drafts.map((d) => ({
          id: d.id,
          title: d.title,
          content: d.content,
          status: d.status,
          tags: d.tags,
          isStarred: d.isStarred,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        })),
      }

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `draftin-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user?.id) return
    setIsDeleting(true)

    try {
      if (isSupabaseConfigured) {
        // Delete profile which cascades drafts
        await supabase.from('profiles').delete().eq('id', user.id)
      }
      draftService.clearUserDrafts(user.id)
      await signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Account deletion failed:', err)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
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
            <h1 className="text-xl font-bold tracking-tight text-foreground">User Settings</h1>
            <p className="text-xs text-muted-foreground">
              Configure your writing workspace preferences, local cache, and cloud synchronization.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Workspace & Editor Layout */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Laptop className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Workspace Viewport</h2>
              <p className="text-[11px] text-muted-foreground">Default LinkedIn preview styling</p>
            </div>
          </div>

          <div className="space-y-3 text-xs pt-1">
            <div className="space-y-1.5">
              <span className="font-semibold text-foreground">Default Preview Device</span>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewDevice('desktop')}
                  className="gap-2 text-xs"
                >
                  <Laptop className="size-3.5" />
                  <span>Desktop Post</span>
                </Button>
                <Button
                  type="button"
                  variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewDevice('mobile')}
                  className="gap-2 text-xs"
                >
                  <Smartphone className="size-3.5" />
                  <span>Mobile Feed</span>
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <span className="font-semibold text-foreground">Editor Layout</span>
              <div className="grid grid-cols-3 gap-2">
                {(['split', 'editor-only', 'preview-only'] as const).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={editorLayout === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditorLayout(mode)}
                    className="text-[11px] capitalize"
                  >
                    {mode.replace('-', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Offline Cache & Storage Isolation */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#0A66C2]/10 text-[#0A66C2]">
              <HardDrive className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Local Storage Isolation</h2>
              <p className="text-[11px] text-muted-foreground">Account-scoped browser persistence</p>
            </div>
          </div>

          <div className="space-y-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">User Storage Key</span>
                <span className="font-mono text-[11px] text-primary truncate max-w-[180px]">
                  draftin_drafts_{user?.id ? user.id.slice(0, 8) + '...' : 'v1'}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Your offline drafts are strictly isolated to this account and never shared across
                sign-ins.
              </p>
            </div>

            {clearedMessage && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">
                <CheckCircle2 className="size-3.5" />
                <span>Offline draft cache cleared for this account.</span>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              className="w-full gap-2 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
              <span>Purge Account Local Cache</span>
            </Button>
          </div>
        </div>

        {/* Data Privacy & GDPR Personal Export */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Download className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Data Privacy & Export</h2>
              <p className="text-[11px] text-muted-foreground">
                Download your complete writing history (GDPR / CCPA)
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Export all your personal profile details, settings, and saved drafts in a standardized
            JSON format for your personal backups.
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full gap-2 text-xs"
          >
            <Download className="size-3.5" />
            <span>{isExporting ? 'Preparing Export...' : `Export All Data (${drafts.length} drafts)`}</span>
          </Button>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="rounded-2xl border border-destructive/20 bg-card p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <UserX className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-destructive">Danger Zone</h2>
              <p className="text-[11px] text-muted-foreground">
                Irreversible account deletion
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Permanently delete your creator account, cloud profile, and all associated drafts. This
            action cannot be undone.
          </p>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="w-full gap-2 text-xs"
          >
            <UserX className="size-3.5" />
            <span>Delete Account & Erase All Data</span>
          </Button>
        </div>

        {/* Cloud Authentication & Session */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Authentication & Session</h2>
                <p className="text-[11px] text-muted-foreground">
                  Active Supabase session management
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => signOut()}
              className="gap-2 text-xs"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/80">
              <span className="text-muted-foreground text-[10px]">Account Email</span>
              <p className="font-semibold text-foreground truncate mt-0.5">
                {user?.email || 'N/A'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/80">
              <span className="text-muted-foreground text-[10px]">User Identifier</span>
              <p className="font-mono text-[11px] text-foreground truncate mt-0.5">
                {user?.id || 'N/A'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/80">
              <span className="text-muted-foreground text-[10px]">Auth Provider</span>
              <p className="font-semibold text-foreground mt-0.5">Google OAuth 2.0</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Permanently Delete Account?"
        description="This will permanently delete your profile, erase all your cloud and offline drafts, and terminate your active session. This action cannot be reversed."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete My Account'}
        variant="destructive"
        onConfirm={handleDeleteAccount}
      />
    </div>
  )
}
