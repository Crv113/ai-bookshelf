import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import FlashCardListPage from './pages/FlashCardListPage'
import FlashCardDetailPage from './pages/FlashCardDetailPage'
import ImportModal from './components/ImportModal'

export default function App() {
  const [importOpen, setImportOpen] = useState(false)

  return (
    <div className="flex min-h-screen" style={{ minWidth: '1280px' }}>
      <Sidebar onImport={() => setImportOpen(true)} />
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F0EBE0' }}>
        <Routes>
          <Route path="/" element={<FlashCardListPage onImport={() => setImportOpen(true)} />} />
          <Route path="/flashcards/:id" element={<FlashCardDetailPage />} />
        </Routes>
      </main>
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}
