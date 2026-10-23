import type { CSSProperties } from 'react'

// Vrai uniquement avec le serveur Vite (`make dev`), faux dans le build servi par Docker
export const IS_DEV = import.meta.env.DEV

const WATERMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160">
<text x="120" y="80" text-anchor="middle" dominant-baseline="middle" transform="rotate(-30 120 80)"
font-family="sans-serif" font-size="40" font-weight="700" fill="#5C1B1B" fill-opacity="0.09">DEV</text>
</svg>`

// Image de fond : elle reste sous tout le contenu, sans couche supplémentaire ni z-index
export const devWatermarkStyle: CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(WATERMARK_SVG)}")`,
  backgroundAttachment: 'fixed',
}

export function DevBadge({ enabled = IS_DEV }: { enabled?: boolean }) {
  if (!enabled) return null
  return (
    <div
      role="status"
      aria-label="Environnement de développement"
      className="fixed top-2 right-2 lg:top-3 lg:right-3 z-50 pointer-events-none print:hidden rounded-md px-2 py-0.5 text-[11px] font-bold tracking-widest bg-brand text-on-brand shadow"
    >
      DEV
    </div>
  )
}
