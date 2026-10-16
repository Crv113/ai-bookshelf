import type { TocItem } from '../types/toc'

interface TableOfContentsProps {
  items: TocItem[]
  activeId: string | null
  onNavigate: (id: string) => void
}

export default function TableOfContents({ items, activeId, onNavigate }: TableOfContentsProps) {
  if (items.length < 2) return null

  return (
    <nav aria-label="Sommaire">
      <ul className="space-y-1.5 text-xs">
        {items.map((item) => {
          const active = item.id === activeId
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active ? 'location' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate(item.id)
                }}
                className={`block break-words transition-colors ${
                  active ? 'text-brand font-medium' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {item.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
