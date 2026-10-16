import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import type { TocItem } from '../types/toc'

export function useTocHeadings(
  containerRef: RefObject<HTMLElement | null>,
  contentKey: string | undefined,
): TocItem[] {
  const [items, setItems] = useState<TocItem[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      setItems([])
      return
    }
    const headings = Array.from(container.querySelectorAll<HTMLHeadingElement>('h2[id]'))
    const next: TocItem[] = []
    for (const heading of headings) {
      if (heading.closest('section[data-footnotes], .mermaid-diagram')) continue
      if (heading.id.startsWith('user-content-')) continue
      const text = heading.textContent?.trim() ?? ''
      if (!text) continue
      next.push({ id: heading.id, text })
    }
    setItems(next)
  }, [containerRef, contentKey])

  return items
}
