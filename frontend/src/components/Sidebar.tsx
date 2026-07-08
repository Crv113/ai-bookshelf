import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchFlashCards } from '../api/flashcards'
import { fetchCategories } from '../api/categories'
import {CardIcon, CloseIcon, LibraryIcon, UploadIcon} from './icons/icons'
import SidebarNavItem from './SidebarNavItem'

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
  const { data: categories = [], isError: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const isHome = location.pathname === '/'
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name))
  const showCategories = !categoriesError && sortedCategories.length > 0

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
        <SidebarNavItem
          to="/"
          onClick={onMobileClose}
          label="Toutes les fiches"
          count={flashCards.length}
          active={isHome}
          icon={<CardIcon active={isHome} />}
        />

        {showCategories && sortedCategories.map((category) => {
          const categoryPath = `/categories/${category.id}`
          const isActive = location.pathname === categoryPath
          return (
            <SidebarNavItem
              key={category.id}
              to={categoryPath}
              onClick={onMobileClose}
              label={category.name}
              count={category.flashCardCount}
              active={isActive}
              icon={<CardIcon active={isActive} />}
            />
          )
        })}

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
