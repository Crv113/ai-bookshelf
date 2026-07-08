import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CategoryFlashCardsPage from './CategoryFlashCardsPage'
import { fetchCategoryById } from '../api/categories'
import { fetchFlashCardsByCategory } from '../api/flashcards'

vi.mock('../api/categories', () => ({
  fetchCategoryById: vi.fn(),
}))

vi.mock('../api/flashcards', () => ({
  fetchFlashCardsByCategory: vi.fn(),
}))

function renderPage(categoryId = 'cat-1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/categories/${categoryId}`]}>
        <Routes>
          <Route path="/categories/:id" element={<CategoryFlashCardsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('CategoryFlashCardsPage', () => {
  beforeEach(() => {
    vi.mocked(fetchCategoryById).mockReset()
    vi.mocked(fetchFlashCardsByCategory).mockReset()
  })

  it('shows a loading state while fetching', () => {
    vi.mocked(fetchCategoryById).mockReturnValue(new Promise(() => {}))
    vi.mocked(fetchFlashCardsByCategory).mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByText('Chargement…')).toBeInTheDocument()
  })

  it('shows a not-found message with a link back home when the category does not exist', async () => {
    vi.mocked(fetchCategoryById).mockRejectedValue(new Error('404'))
    vi.mocked(fetchFlashCardsByCategory).mockRejectedValue(new Error('404'))

    renderPage('missing-id')

    await waitFor(() => expect(screen.getByText('Catégorie introuvable.')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: /Retour à la liste/ })).toHaveAttribute('href', '/')
  })

  it('shows an empty-category message when the category has no flashcards', async () => {
    vi.mocked(fetchCategoryById).mockResolvedValue({
      id: 'cat-1', name: 'Java', createdAt: '2026-01-01', flashCardCount: 0,
    })
    vi.mocked(fetchFlashCardsByCategory).mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByText('Java')).toBeInTheDocument())
    expect(screen.getByText('Aucune flashcard dans cette catégorie.')).toBeInTheDocument()
  })

  it('lists the flashcards of the category under its name', async () => {
    vi.mocked(fetchCategoryById).mockResolvedValue({
      id: 'cat-1', name: 'Java', createdAt: '2026-01-01', flashCardCount: 1,
    })
    vi.mocked(fetchFlashCardsByCategory).mockResolvedValue([
      { id: 'fc-1', title: 'Les generics', createdAt: '2026-01-01', summary: 'Résumé generics' },
    ])

    renderPage()

    await waitFor(() => expect(screen.getByText('Java')).toBeInTheDocument())
    expect(screen.getByText('Les generics')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Les generics/ })).toHaveAttribute('href', '/flashcards/fc-1')
  })
})
