import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchFlashCards } from '../api/flashcards'

interface SidebarProps {
  onImport: () => void
}

function LibraryIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C4742A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m16 6 4 14"/>
      <path d="M12 6v14"/>
      <path d="M8 8v12"/>
      <path d="M4 4v16"/>
    </svg>
  )
}

function CardIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? '#E8DDD0' : '#6B5540'}>
      <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
    </svg>
  )
}

function UploadIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? '#E8DDD0' : '#6B5540'}>
      <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
    </svg>
  )
}

export default function Sidebar({ onImport }: SidebarProps) {
  const location = useLocation()
  const { data: flashCards = [] } = useQuery({
    queryKey: ['flashcards'],
    queryFn: fetchFlashCards,
  })

  const isHome = location.pathname === '/'

  return (
    <aside
      className="w-52 shrink-0 flex flex-col h-screen sticky top-0"
      style={{ backgroundColor: 'oklch(28% .04 30)' }}
    >
      <div className="px-4 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/" className="flex items-center gap-2.5">
          <LibraryIcon />
          <div>
            <div className="text-sm font-semibold leading-none" style={{ color: '#E8DDD0', letterSpacing: '-0.01em' }}>
              ai-bookshelf
            </div>
            <div className="text-[9px] uppercase tracking-widest mt-1" style={{ color: '#4A3525' }}>
              Your Study Library
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        <Link
          to="/"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors"
          style={{
            backgroundColor: isHome ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: isHome ? '#E8DDD0' : '#6B5540',
          }}
          onMouseEnter={(e) => { if (!isHome) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)' }}
          onMouseLeave={(e) => { if (!isHome) e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <div className="flex items-center gap-2.5">
            <CardIcon active={isHome} />
            <span>Toutes les fiches</span>
          </div>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#6B5540' }}
          >
            {flashCards.length}
          </span>
        </Link>

        <button
          onClick={onImport}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors"
          style={{ color: '#6B5540' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#9E8870' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6B5540' }}
        >
          <UploadIcon active={false} />
          <span>Importer un JSON</span>
        </button>
      </nav>
    </aside>
  )
}
