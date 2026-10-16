import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FlashCardDetailPage from './FlashCardDetailPage'
import { fetchFlashCard, updateFlashCard } from '../api/flashcards'
import type { FlashCardResponse } from '../types/flashcard'

vi.mock('../api/flashcards', () => ({
  fetchFlashCard: vi.fn(),
  deleteFlashCard: vi.fn(),
  updateFlashCard: vi.fn(),
}))

vi.mock('../components/MermaidDiagram', () => ({ default: () => null }))

function buildCard(content: string, overrides: Partial<FlashCardResponse> = {}): FlashCardResponse {
  return {
    id: 'fc-1',
    title: 'Les generics',
    createdAt: '2026-01-01',
    summary: 'Résumé generics',
    content,
    model: null,
    estimatedTime: null,
    categoryId: 'cat-1',
    ...overrides,
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

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true })
}

function buildFullCard() {
  return buildCard('## Seul titre\n\nTexte', { model: 'Claude Opus 5.5', estimatedTime: 12 })
}

describe('FlashCardDetailPage copy JSON', () => {
  beforeEach(() => {
    vi.mocked(fetchFlashCard).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard)
    } else {
      setClipboard(undefined)
    }
  })

  it('copies the card in the import format and resets the label after 2 seconds', async () => {
    const card = buildFullCard()
    vi.mocked(fetchFlashCard).mockResolvedValue(card)
    renderPage()
    const button = await screen.findByRole('button', { name: 'Copier JSON' })

    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })

    await act(async () => {
      fireEvent.click(button)
    })

    expect(writeText).toHaveBeenCalledWith(JSON.stringify({
      title: card.title,
      summary: card.summary,
      model: card.model,
      content: card.content,
      estimated_time: 12,
    }, null, 2))
    expect(screen.getByRole('button', { name: 'Copié' })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByRole('button', { name: 'Copier JSON' })).toBeInTheDocument()
  })

  it('shows a failure message when the clipboard rejects', async () => {
    vi.mocked(fetchFlashCard).mockResolvedValue(buildFullCard())
    renderPage()
    const button = await screen.findByRole('button', { name: 'Copier JSON' })
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) })

    await act(async () => {
      fireEvent.click(button)
    })

    expect(screen.getByRole('button', { name: 'Échec de la copie' })).toBeInTheDocument()
  })

  it('shows a failure message when the clipboard is unavailable', async () => {
    vi.mocked(fetchFlashCard).mockResolvedValue(buildFullCard())
    renderPage()
    const button = await screen.findByRole('button', { name: 'Copier JSON' })
    setClipboard(undefined)

    await act(async () => {
      fireEvent.click(button)
    })

    expect(screen.getByRole('button', { name: 'Échec de la copie' })).toBeInTheDocument()
  })
})

describe('FlashCardDetailPage replace', () => {
  const newContent = '## Alpha\n\nA\n\n## Beta\n\nB\n\n## Gamma\n\nC'
  const newJson = JSON.stringify({
    title: 'Nouveau titre',
    summary: 'Nouveau résumé',
    model: 'Claude Opus 5.5',
    content: newContent,
    estimated_time: 20,
  })

  beforeEach(() => {
    vi.mocked(fetchFlashCard).mockReset()
    vi.mocked(updateFlashCard).mockReset()
    Element.prototype.scrollIntoView = vi.fn()
  })

  async function openReplaceModal() {
    vi.mocked(fetchFlashCard).mockResolvedValue(buildFullCard())
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Remplacer' }))
    return screen.getByRole('dialog', { name: 'Remplacer la fiche' })
  }

  function typeJson(dialog: HTMLElement, value: string) {
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'JSON de la fiche' }), { target: { value } })
  }

  it('opens a modal with a warning and no category selector', async () => {
    const dialog = await openReplaceModal()

    expect(within(dialog).getByText(/sera définitivement écrasé/)).toBeInTheDocument()
    expect(within(dialog).queryByRole('combobox')).not.toBeInTheDocument()
    expect(within(dialog).getByRole('textbox', { name: 'JSON de la fiche' })).toHaveValue('')
  })

  it('replaces the card while keeping its category and refreshes the page', async () => {
    vi.mocked(updateFlashCard).mockResolvedValue({
      ...buildFullCard(),
      title: 'Nouveau titre',
      summary: 'Nouveau résumé',
      content: newContent,
      estimatedTime: 20,
    })
    const dialog = await openReplaceModal()

    typeJson(dialog, newJson)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Remplacer' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Remplacer la fiche' })).not.toBeInTheDocument())
    expect(updateFlashCard).toHaveBeenCalledWith('fc-1', {
      title: 'Nouveau titre',
      summary: 'Nouveau résumé',
      content: newContent,
      model: 'Claude Opus 5.5',
      estimatedTime: 20,
      categoryId: 'cat-1',
    })
    expect(screen.getByRole('heading', { level: 1, name: 'Nouveau titre' })).toBeInTheDocument()
    expect(screen.getByText('Nouveau résumé')).toBeInTheDocument()
    const nav = await screen.findByRole('navigation', { name: 'Sommaire' })
    await waitFor(() => expect(within(nav).getAllByRole('link')).toHaveLength(3))
  })

  it('shows an error and keeps the modal open on invalid JSON', async () => {
    const dialog = await openReplaceModal()

    typeJson(dialog, '{ "title": ')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Remplacer' }))

    expect(within(dialog).getByText('JSON invalide. Vérifiez la syntaxe.')).toBeInTheDocument()
    expect(updateFlashCard).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Remplacer la fiche' })).toBeInTheDocument()
  })

  it('shows the API error and keeps the JSON when the update fails', async () => {
    vi.mocked(updateFlashCard).mockRejectedValue(new Error('Category with ID x not found.'))
    const dialog = await openReplaceModal()

    typeJson(dialog, newJson)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Remplacer' }))

    expect(await within(dialog).findByText('Category with ID x not found.')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Remplacer la fiche' })).toBeInTheDocument()
    expect(within(dialog).getByRole('textbox', { name: 'JSON de la fiche' })).toHaveValue(newJson)
  })

  it('clears the JSON when the modal is cancelled and reopened', async () => {
    const dialog = await openReplaceModal()

    typeJson(dialog, newJson)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('dialog', { name: 'Remplacer la fiche' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Remplacer' }))
    const reopened = screen.getByRole('dialog', { name: 'Remplacer la fiche' })
    expect(within(reopened).getByRole('textbox', { name: 'JSON de la fiche' })).toHaveValue('')
  })
})
