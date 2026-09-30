import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Sidebar from './Sidebar'
import { fetchFlashCards } from '../api/flashcards'
import { fetchCategories } from '../api/categories'

vi.mock('../api/flashcards', () => ({
  fetchFlashCards: vi.fn(),
}))

vi.mock('../api/categories', () => ({
  fetchCategories: vi.fn(),
}))

function renderSidebar(initialPath = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Sidebar onImport={vi.fn()} mobileOpen={false} onMobileClose={vi.fn()} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.mocked(fetchFlashCards).mockResolvedValue([
      { id: '1', title: 'A', createdAt: '2026-01-01', summary: 's', model: null, estimatedTime: null },
      { id: '2', title: 'B', createdAt: '2026-01-01', summary: 's', model: null, estimatedTime: null },
    ])
  })

  it('shows the total flashcard count next to "Toutes les fiches"', async () => {
    vi.mocked(fetchCategories).mockResolvedValue([])
    renderSidebar()

    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument())
  })

  it('renders categories sorted alphabetically with their flashcard count', async () => {
    vi.mocked(fetchCategories).mockResolvedValue([
      { id: 'b', name: 'Spring', createdAt: '2026-01-01', flashCardCount: 5 },
      { id: 'a', name: 'Java', createdAt: '2026-01-01', flashCardCount: 2 },
    ])
    renderSidebar()

    await waitFor(() => expect(screen.getByText('Java')).toBeInTheDocument())
    const links = screen.getAllByRole('link').map((link) => link.textContent)
    const javaIndex = links.findIndex((text) => text?.includes('Java'))
    const springIndex = links.findIndex((text) => text?.includes('Spring'))
    expect(javaIndex).toBeLessThan(springIndex)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders a category with 0 flashcards without hiding it', async () => {
    vi.mocked(fetchCategories).mockResolvedValue([
      { id: 'a', name: 'Vide', createdAt: '2026-01-01', flashCardCount: 0 },
    ])
    renderSidebar()

    await waitFor(() => expect(screen.getByText('Vide')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: /Vide/ })).toHaveTextContent('0')
  })

  it('renders no category section when there are no categories', async () => {
    vi.mocked(fetchCategories).mockResolvedValue([])
    renderSidebar()

    await waitFor(() => expect(screen.getByText('Toutes les fiches')).toBeInTheDocument())
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('renders no category section when the categories query fails', async () => {
    vi.mocked(fetchCategories).mockRejectedValue(new Error('boom'))
    renderSidebar()

    await waitFor(() => expect(screen.getByText('Toutes les fiches')).toBeInTheDocument())
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('marks the matching category link as active based on the current path', async () => {
    vi.mocked(fetchCategories).mockResolvedValue([
      { id: 'a', name: 'Java', createdAt: '2026-01-01', flashCardCount: 2 },
    ])
    renderSidebar('/categories/a')

    await waitFor(() => expect(screen.getByText('Java')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: /Java/ }).className).toContain('text-sidebar-active')
  })
})
