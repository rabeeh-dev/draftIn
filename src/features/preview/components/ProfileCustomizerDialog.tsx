import { useState } from 'react'
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserCheck, Sparkles } from 'lucide-react'
import type { UserProfile } from '@/types'

interface ProfileCustomizerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: UserProfile
  onSave: (updated: Partial<UserProfile>) => void
}

export function ProfileCustomizerDialog({
  open,
  onOpenChange,
  profile,
  onSave,
}: ProfileCustomizerDialogProps) {
  const [name, setName] = useState(profile.name)
  const [headline, setHeadline] = useState(profile.headline)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name: name.trim() || 'Alex Morgan',
      headline: headline.trim() || 'Professional Creator',
      avatarUrl: avatarUrl.trim() || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#0A66C2]/10 text-[#0A66C2]">
            <UserCheck className="size-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold">Customize LinkedIn Profile</DialogTitle>
            <DialogDescription className="text-xs">
              Configure how your author card renders in the live LinkedIn preview.
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* Avatar Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <Avatar size="lg" className="ring-2 ring-[#0A66C2]/30">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-semibold text-foreground">Avatar Image URL</label>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="text-xs h-8"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Full Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="text-xs h-9"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Headline</label>
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Staff Engineer • Writing on tech & careers"
              className="text-xs h-9"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="gap-1.5 bg-[#0A66C2] hover:bg-[#0A66C2]/90">
              <Sparkles className="size-3.5" />
              <span>Save Profile</span>
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
