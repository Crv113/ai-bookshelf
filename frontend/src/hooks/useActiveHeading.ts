import { useCallback, useEffect, useRef, useState } from 'react'

// Délai sans événement scroll au-delà duquel on considère le défilement programmatique terminé
const SCROLL_IDLE_MS = 150

export function useActiveHeading(ids: string[]): [string | null, (id: string | null) => void] {
  const [activeId, setActiveId] = useState<string | null>(null)
  const lockedRef = useRef(false)
  const idsKey = ids.join('\n')

  // Après un clic dans le sommaire, on fige l'entrée active pendant le défilement doux :
  // sans ça, l'observer marquerait tour à tour chaque titre traversé.
  const selectHeading = useCallback((id: string | null) => {
    setActiveId(id)
    if (id === null) return

    lockedRef.current = true
    let timer = window.setTimeout(unlock, SCROLL_IDLE_MS)
    function onScroll() {
      window.clearTimeout(timer)
      timer = window.setTimeout(unlock, SCROLL_IDLE_MS)
    }
    function unlock() {
      lockedRef.current = false
      window.removeEventListener('scroll', onScroll)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
  }, [])

  useEffect(() => {
    setActiveId(null)
    if (typeof IntersectionObserver === 'undefined' || idsKey === '') return

    const orderedIds = idsKey.split('\n')
    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        if (lockedRef.current) return
        const first = orderedIds.find((id) => visible.has(id))
        if (first) setActiveId(first)
      },
      { rootMargin: '0px 0px -70% 0px' },
    )

    for (const id of orderedIds) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }

    return () => observer.disconnect()
  }, [idsKey])

  return [activeId, selectHeading]
}
