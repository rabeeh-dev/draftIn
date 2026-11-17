import { useDraftStore } from '@/stores/draft.store'
import { Smartphone, Monitor } from 'lucide-react'

export function PreviewHeader({
  isExpanded,
  onToggleExpanded,
}: {
  isExpanded: boolean
  onToggleExpanded: () => void
}) {
  const { previewDevice, setPreviewDevice } = useDraftStore()

  return (
    <div className="flex h-11 items-center justify-between px-4 border-b border-border bg-card/60 backdrop-blur-xs">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-[#0A66C2]" />
        <span className="text-xs font-bold tracking-tight text-foreground">LinkedIn Feed Simulation</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Expanded / Collapsed "see more" toggle */}
        <button
          onClick={onToggleExpanded}
          className="text-[11px] font-medium text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-md hover:bg-muted transition-colors"
        >
          {isExpanded ? 'Show with "...see more"' : 'Show Full Post'}
        </button>

        {/* Device Switcher */}
        <div className="flex items-center rounded-lg bg-muted/60 p-0.5 border border-border/80">
          <button
            onClick={() => setPreviewDevice('mobile')}
            className={`p-1 rounded-md transition-colors ${
              previewDevice === 'mobile'
                ? 'bg-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Mobile Device Feed (375px)"
          >
            <Smartphone className="size-3.5" />
          </button>
          <button
            onClick={() => setPreviewDevice('desktop')}
            className={`p-1 rounded-md transition-colors ${
              previewDevice === 'desktop'
                ? 'bg-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Desktop Feed (550px)"
          >
            <Monitor className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
