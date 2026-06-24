import { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import FlashCardListPage from './pages/FlashCardListPage'
import FlashCardDetailPage from './pages/FlashCardDetailPage'
import ImportModal from './components/ImportModal'
import {LibraryIcon} from './components/icons/icons'

function PanelLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2"/>
      <path d="M9 3v18"/>
    </svg>
  )
}

export default function App() {
  const [importOpen, setImportOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F0EBE0' }}>
      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center justify-between px-4"
        style={{ backgroundColor: 'oklch(28% .04 30)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-md transition-colors"
          style={{ color: '#9E8870' }}
        >
          <PanelLeftIcon />
        </button>
        <Link to="/" className="flex items-center gap-2" style={{ color: '#C4742A' }}>
          <LibraryIcon />
          <span className="text-sm font-semibold" style={{ letterSpacing: '-0.01em' }}>ai-bookshelf</span>
        </Link>
        <div className="w-8" />
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        onImport={() => { setSidebarOpen(false); setImportOpen(true) }}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0" style={{ backgroundColor: '#F0EBE0' }}>
        <Routes>
          <Route path="/" element={<FlashCardListPage onImport={() => setImportOpen(true)} />} />
          <Route path="/flashcards/:id" element={<FlashCardDetailPage />} />
        </Routes>
      </main>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}
