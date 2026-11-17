import { useState } from 'react'
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Link2, Trash2 } from 'lucide-react'

interface LinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialUrl?: string
  onSave: (url: string) => void
  onRemove?: () => void
}

function LinkDialogContent({
  initialUrl = '',
  onSave,
  onRemove,
  onClose,
}: {
  initialUrl?: string
  onSave: (url: string) => void
  onRemove?: () => void
  onClose: () => void
}) {
  const [url, setUrl] = useState(initialUrl)

  const handleSave = () => {
    let cleanUrl = url.trim()
    if (!cleanUrl) return

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('mailto:')) {
      cleanUrl = `https://${cleanUrl}`
    }

    onSave(cleanUrl)
    onClose()
  }

  return (
    <DialogPopup className="max-w-md">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Link2 className="size-4" />
        </div>
        <div>
          <DialogTitle className="text-base">Insert Link</DialogTitle>
          <DialogDescription className="text-xs">
            Add a web URL or resource link to the selected text.
          </DialogDescription>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Destination URL</label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="text-xs h-9"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSave()
              }
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        {onRemove && initialUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onRemove()
              onClose()
            }}
            className="gap-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
            <span>Remove Link</span>
          </Button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!url.trim()}
          >
            Apply Link
          </Button>
        </div>
      </div>
    </DialogPopup>
  )
}

export function LinkDialog({
  open,
  onOpenChange,
  initialUrl = '',
  onSave,
  onRemove,
}: LinkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <LinkDialogContent
          initialUrl={initialUrl}
          onSave={onSave}
          onRemove={onRemove}
          onClose={() => onOpenChange(false)}
        />
      )}
    </Dialog>
  )
}
