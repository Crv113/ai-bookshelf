import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchFlashCards } from '../api/flashcards'
import {CardIcon, CloseIcon, LibraryIcon, UploadIcon} from './icons/icons'

interface SidebarProps {
  onImport: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ onImport, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation()
  const { data: flashCards = [] } = useQuery({
    queryKey: ['flashcards'],
    queryFn: fetchFlashCards,
  })

  const isHome = location.pathname === '/'

  return (
    <aside
      className="fixed lg:sticky top-0 z-50 lg:z-auto h-screen flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shrink-0 bg-sidebar"
      style={{
        width: '208px',
        transform: mobileOpen ? 'translateX(0)' : undefined,
      }}
      data-mobile-open={mobileOpen}
    >
      <style>{`
        @media (max-width: 1023px) {
          aside[data-mobile-open="false"] { transform: translateX(-100%); }
          aside[data-mobile-open="true"]  { transform: translateX(0); }
        }
      `}</style>

      <div className="px-4 pt-6 pb-5 border-b border-white-subtle">
        <div className="flex items-center justify-between">
          <Link to="/" onClick={onMobileClose} className="flex items-center gap-2.5">
            <LibraryIcon />
            <div>
              <div className="text-sm font-semibold leading-none text-accent" style={{ letterSpacing: '-0.01em' }}>
                ai-bookshelf
              </div>
            </div>
          </Link>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1 rounded text-muted"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        <Link
          to="/"
          onClick={onMobileClose}
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${isHome ? 'bg-[rgba(255,255,255,0.08)] text-sidebar-active' : 'text-muted hover:bg-[rgba(255,255,255,0.04)]'}`}
        >
          <div className="flex items-center gap-2.5">
            <CardIcon active={isHome} />
            <span>Toutes les fiches</span>
          </div>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-white-subtle text-muted"
          >
            {flashCards.length}
          </span>
        </Link>

        <button
          onClick={onImport}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors text-muted hover:bg-[rgba(255,255,255,0.04)] hover:text-muted-hover hover:cursor-pointer"
        >
          <UploadIcon />
          <span>Importer un JSON</span>
        </button>
      </nav>
    </aside>
  )
}
