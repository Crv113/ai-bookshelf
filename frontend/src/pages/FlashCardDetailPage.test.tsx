import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FlashCardDetailPage from './FlashCardDetailPage'
import { fetchFlashCard } from '../api/flashcards'
import type { FlashCardResponse } from '../types/flashcard'

vi.mock('../api/flashcards', () => ({
  fetchFlashCard: vi.fn(),
  deleteFlashCard: vi.fn(),
}))

vi.mock('../components/MermaidDiagram', () => ({ default: () => null }))

function buildCard(content: string): FlashCardResponse {
  return {
    id: 'fc-1',
    title: 'Les generics',
    createdAt: '2026-01-01',
    summary: 'Résumé generics',
    content,
    model: null,
    estimatedTime: null,
    categoryId: 'cat-1',
  }
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/flashcards/fc-1']}>
        <Routes>
          <Route path="/flashcards/:id" element={<FlashCardDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const contentWithToc = '## Introduction\n\nTexte[^1]\n\n### Sous-partie\n\nTexte\n\n## Détails\n\nSuite\n\n[^1]: Une note'

describe('FlashCardDetailPage table of contents', () => {
  beforeEach(() => {
    vi.mocked(fetchFlashCard).mockReset()
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('lists only the h2 content headings, without h3 nor the footnotes heading', async () => {
    vi.mocked(fetchFlashCard).mockResolvedValue(buildCard(contentWithToc))

    renderPage()

    await waitFor(() => expect(screen.getAllByRole('navigation', { name: 'Sommaire' })).toHaveLength(1))
    const nav = screen.getByRole('navigation', { name: 'Sommaire' })
    const links = within(nav).getAllByRole('link')
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', '#introduction')
    expect(links[1]).toHaveAttribute('href', '#détails')
    expect(within(nav).queryByText('Sous-partie')).not.toBeInTheDocument()
    expect(within(nav).queryByText(/Footnotes/i)).not.toBeInTheDocument()
  })

  it('shows no table of contents with a single heading', async () => {
    vi.mocked(fetchFlashCard).mockResolvedValue(buildCard('## Seul titre\n\nTexte'))

    renderPage()

    await waitFor(() => expect(screen.getByText('Seul titre')).toBeInTheDocument())
    expect(screen.queryByRole('navigation', { name: 'Sommaire' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ouvrir le sommaire' })).not.toBeInTheDocument()
  })

  it('shows no table of contents when only h4 headings exist', async () => {
    vi.mocked(fetchFlashCard).mockResolvedValue(buildCard('#### Un\n\n#### Deux'))

    renderPage()

    await waitFor(() => expect(screen.getByText('Deux')).toBeInTheDocument())
    expect(screen.queryByRole('navigation', { name: 'Sommaire' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ouvrir le sommaire' })).not.toBeInTheDocument()
  })

  it('scrolls to the heading and marks the link active on click', async () => {
    vi.mocked(fetchFlashCard).mockResolvedValue(buildCard(contentWithToc))

    renderPage()

    const nav = await screen.findByRole('navigation', { name: 'Sommaire' })
    const link = within(nav).getByRole('link', { name: 'Détails' })
    await userEvent.click(link)

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(link).toHaveAttribute('aria-current', 'location')
  })

  it('shows no table of contents while loading', () => {
    vi.mocked(fetchFlashCard).mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByText('Chargement…')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Sommaire' })).not.toBeInTheDocument()
  })

  it('opens the drawer and closes it with Escape', async () => {
    vi.mocked(fetchFlashCard).mockResolvedValue(buildCard(contentWithToc))

    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Ouvrir le sommaire' }))
    expect(screen.getByRole('dialog', { name: 'Sommaire' })).toBeInTheDocument()
    expect(screen.getAllByRole('navigation', { name: 'Sommaire' })).toHaveLength(2)

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog', { name: 'Sommaire' })).not.toBeInTheDocument()
  })
})
