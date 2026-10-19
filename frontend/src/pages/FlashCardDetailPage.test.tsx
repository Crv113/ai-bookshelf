import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
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

function renderPage(extra?: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/flashcards/fc-1']}>
        {extra}
        <Routes>
          <Route path="/flashcards/:id" element={<FlashCardDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return { ...result, queryClient }
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

describe('FlashCardDetailPage section editing', () => {
  const C = 'Intro\n\n## A\n\nTexte A\n\n## B\n\nTexte B\n'
  const MISSING_META_ERROR = "Impossible d'enregistrer : le modèle et la durée estimée doivent être renseignés (utilisez « Remplacer par un JSON »)."

  function fullCard(content: string, overrides: Partial<FlashCardResponse> = {}) {
    return buildCard(content, { model: 'Claude Opus 5.5', estimatedTime: 12, ...overrides })
  }

  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
    vi.mocked(fetchFlashCard).mockReset()
    vi.mocked(updateFlashCard).mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  async function openSection(content: string, name: string, overrides: Partial<FlashCardResponse> = {}) {
    vi.mocked(fetchFlashCard).mockResolvedValue(fullCard(content, overrides))
    const rendered = renderPage()
    fireEvent.click(await screen.findByRole('button', { name }))
    return { ...rendered, textarea: screen.getByRole('textbox', { name: 'Markdown de la section' }) }
  }

  function editorRegion(name: string) {
    return screen.getByRole('region', { name })
  }

  it('shows an edit button per root h2 only', async () => {
    vi.mocked(fetchFlashCard).mockResolvedValue(fullCard(contentWithToc))
    renderPage()

    await screen.findByRole('button', { name: 'Modifier la section « Introduction »' })
    const buttons = screen.getAllByRole('button', { name: /^Modifier la section/ })
    expect(buttons).toHaveLength(2)
    expect(buttons[1]).toHaveAccessibleName('Modifier la section « Détails »')
  })

  it('shows an intro button only for a non blank intro', async () => {
    vi.mocked(fetchFlashCard).mockResolvedValue(fullCard(C))
    renderPage()
    expect(await screen.findByRole('button', { name: "Modifier l'introduction" })).toBeInTheDocument()
  })

  it.each(['\n\n## A\n\n## B', '## A\n\n## B'])('shows no intro button for %j', async (content) => {
    vi.mocked(fetchFlashCard).mockResolvedValue(fullCard(content))
    renderPage()
    await screen.findByRole('button', { name: 'Modifier la section « A »' })
    expect(screen.queryByRole('button', { name: "Modifier l'introduction" })).not.toBeInTheDocument()
  })

  it('opens the editor with the section markdown and focuses it', async () => {
    const { textarea } = await openSection(C, 'Modifier la section « B »')

    expect(textarea).toHaveValue('## B\n\nTexte B')
    expect(textarea).toHaveFocus()
    expect(editorRegion('Édition de la section « B »')).toBeInTheDocument()
  })

  it('closes without confirmation when nothing changed', async () => {
    const confirm = vi.spyOn(window, 'confirm')
    await openSection(C, 'Modifier la section « B »')

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(screen.queryByRole('textbox', { name: 'Markdown de la section' })).not.toBeInTheDocument()
    expect(confirm).not.toHaveBeenCalled()
    expect(updateFlashCard).not.toHaveBeenCalled()
  })

  it('asks for confirmation before discarding changes', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { textarea } = await openSection(C, 'Modifier la section « B »')
    fireEvent.change(textarea, { target: { value: '## B\n\nautre' } })

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(confirm).toHaveBeenCalledWith('Abandonner les modifications non enregistrées de cette section ?')
    expect(screen.getByRole('textbox', { name: 'Markdown de la section' })).toHaveValue('## B\n\nautre')

    confirm.mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('textbox', { name: 'Markdown de la section' })).not.toBeInTheDocument()
  })

  it('disables Enregistrer while the draft is unchanged', async () => {
    const { textarea } = await openSection(C, 'Modifier la section « B »')
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()

    fireEvent.change(textarea, { target: { value: '## B\n\nautre' } })
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled()

    fireEvent.change(textarea, { target: { value: '## B\n\nTexte B' } })
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
  })

  it('sends the full card with the rebuilt content', async () => {
    vi.mocked(updateFlashCard).mockReturnValue(new Promise(() => {}))
    const { textarea } = await openSection(C, 'Modifier la section « B »')

    fireEvent.change(textarea, { target: { value: '## B\n\nTexte B modifié\n\n\n' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(updateFlashCard).toHaveBeenCalledWith('fc-1', {
      title: 'Les generics',
      summary: 'Résumé generics',
      model: 'Claude Opus 5.5',
      estimatedTime: 12,
      categoryId: 'cat-1',
      content: 'Intro\n\n## A\n\nTexte A\n\n## B\n\nTexte B modifié\n',
    }))
  })

  it('keeps CRLF line endings in the payload', async () => {
    vi.mocked(updateFlashCard).mockReturnValue(new Promise(() => {}))
    const crlf = 'Intro\r\n\r\n## A\r\n\r\nTexte A\r\n\r\n## B\r\n\r\nTexte B\r\n'
    const { textarea } = await openSection(crlf, 'Modifier la section « A »')

    expect(textarea).toHaveValue('## A\n\nTexte A')
    fireEvent.change(textarea, { target: { value: '## A\n\nNouveau A' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(updateFlashCard).toHaveBeenCalledTimes(1))
    expect(vi.mocked(updateFlashCard).mock.calls[0][1].content).toBe(
      'Intro\r\n\r\n## A\r\n\r\nNouveau A\r\n\r\n## B\r\n\r\nTexte B\r\n',
    )
  })

  it('closes the editor and shows the saved content on success', async () => {
    const saved = 'Intro\n\n## A\n\nTexte A\n\n## B2\n\nTexte B modifié\n'
    vi.mocked(updateFlashCard).mockResolvedValue(fullCard(saved))
    const { textarea } = await openSection(C, 'Modifier la section « B »')

    fireEvent.change(textarea, { target: { value: '## B2\n\nTexte B modifié' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Markdown de la section' })).not.toBeInTheDocument())
    expect(screen.getByText('Texte B modifié')).toBeInTheDocument()
    expect(screen.queryByText('Chargement…')).not.toBeInTheDocument()
    const nav = await screen.findByRole('navigation', { name: 'Sommaire' })
    await waitFor(() => expect(within(nav).getByRole('link', { name: 'B2' })).toBeInTheDocument())
    expect(fetchFlashCard).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Modifier la section « B2 »' })).toHaveFocus())
  })

  it('shows the API error and keeps the draft', async () => {
    vi.mocked(updateFlashCard).mockRejectedValueOnce(new Error('Boom'))
    const { textarea } = await openSection(C, 'Modifier la section « B »')

    fireEvent.change(textarea, { target: { value: '## B\n\nautre' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    const region = editorRegion('Édition de la section « B »')
    expect(await within(region).findByRole('alert')).toHaveTextContent('Boom')
    expect(screen.getByRole('textbox', { name: 'Markdown de la section' })).toHaveValue('## B\n\nautre')

    vi.mocked(updateFlashCard).mockReturnValue(new Promise(() => {}))
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(within(region).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('asks before switching away from a modified section', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { textarea } = await openSection(C, 'Modifier la section « A »')
    fireEvent.change(textarea, { target: { value: '## A\n\nmodifié' } })

    fireEvent.click(screen.getByRole('button', { name: 'Modifier la section « B »' }))
    expect(confirm).toHaveBeenCalled()
    expect(within(editorRegion('Édition de la section « A »')).getByRole('textbox')).toHaveValue('## A\n\nmodifié')

    confirm.mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: 'Modifier la section « B »' }))
    expect(screen.queryByRole('region', { name: 'Édition de la section « A »' })).not.toBeInTheDocument()
    expect(editorRegion('Édition de la section « B »')).toBeInTheDocument()
    expect(screen.getAllByRole('textbox', { name: 'Markdown de la section' })).toHaveLength(1)
  })

  it('toggles a preview and keeps the draft', async () => {
    const { textarea } = await openSection(C, 'Modifier la section « B »')
    fireEvent.change(textarea, { target: { value: '## B\n\n**gras**' } })

    const previewButton = screen.getByRole('button', { name: 'Aperçu' })
    fireEvent.click(previewButton)

    expect(previewButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('textbox', { name: 'Markdown de la section' })).not.toBeInTheDocument()
    const region = editorRegion('Édition de la section « B »')
    expect(region.querySelector('strong')).toHaveTextContent('gras')
    expect(region.querySelector('h2')).not.toHaveAttribute('id')

    fireEvent.click(screen.getByRole('button', { name: 'Édition' }))
    expect(screen.getByRole('textbox', { name: 'Markdown de la section' })).toHaveValue('## B\n\n**gras**')
  })

  it.each([
    'Titre\n---\n\n## A\n\nx\n\n## B\n\ny',
    '<div>\n## X\n</div>\n\n## A\n\n## B',
  ])('shows no edit button when the split is inconsistent %#', async (content) => {
    vi.mocked(fetchFlashCard).mockResolvedValue(fullCard(content))
    renderPage()

    const nav = await screen.findByRole('navigation', { name: 'Sommaire' })
    expect(screen.queryByRole('button', { name: /^Modifier/ })).not.toBeInTheDocument()
    if (content.startsWith('Titre')) {
      await waitFor(() => expect(within(nav).getAllByRole('link')).toHaveLength(3))
    }
  })

  it('ignores h2 nested in blockquotes and lists', async () => {
    const content = '## A\n\n> ## Citation\n\n- ## Item\n\n## B\n\ntexte B'
    vi.mocked(fetchFlashCard).mockResolvedValue(fullCard(content))
    renderPage()

    await screen.findByRole('button', { name: 'Modifier la section « A »' })
    expect(screen.getAllByRole('button', { name: /^Modifier/ })).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Modifier la section « B »' }))
    expect(screen.getByRole('textbox', { name: 'Markdown de la section' })).toHaveValue('## B\n\ntexte B')
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))

    fireEvent.click(screen.getByRole('button', { name: 'Modifier la section « A »' }))
    expect(screen.getByRole('textbox', { name: 'Markdown de la section' })).toHaveValue('## A\n\n> ## Citation\n\n- ## Item')
  })

  it('ignores headings inside fenced code', async () => {
    const content = '## A\n\n```\n## Faux\n```\n\n## B\n\nfin'
    vi.mocked(fetchFlashCard).mockResolvedValue(fullCard(content))
    renderPage()

    await screen.findByRole('button', { name: 'Modifier la section « A »' })
    const buttons = screen.getAllByRole('button', { name: /^Modifier/ })
    expect(buttons).toHaveLength(2)
    fireEvent.click(buttons[1])
    expect(screen.getByRole('textbox', { name: 'Markdown de la section' })).toHaveValue('## B\n\nfin')
  })

  it('refuses to save when model or estimated time are missing', async () => {
    vi.mocked(fetchFlashCard).mockResolvedValue(buildCard(C))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Modifier la section « B »' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Markdown de la section' }), { target: { value: '## B\n\nx' } })

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(screen.getByRole('alert')).toHaveTextContent(MISSING_META_ERROR)
    expect(updateFlashCard).not.toHaveBeenCalled()
  })

  it('refuses to save an empty card', async () => {
    const { textarea } = await openSection('## Seul\n\nTexte', 'Modifier la section « Seul »')

    fireEvent.change(textarea, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(screen.getByRole('alert')).toHaveTextContent('La fiche ne peut pas être vide.')
    expect(updateFlashCard).not.toHaveBeenCalled()
  })

  it('disables saving while the request is pending and sends a single request', async () => {
    vi.mocked(updateFlashCard).mockReturnValue(new Promise(() => {}))
    const { textarea } = await openSection(C, 'Modifier la section « B »')
    fireEvent.change(textarea, { target: { value: '## B\n\nx' } })

    const save = screen.getByRole('button', { name: 'Enregistrer' })
    fireEvent.click(save)
    fireEvent.click(save)

    await waitFor(() => expect(screen.getByRole('button', { name: 'Enregistrement…' })).toBeDisabled())
    expect(updateFlashCard).toHaveBeenCalledTimes(1)
  })

  it('hides the editor and pencils when printing', async () => {
    const { container } = await openSection(C, 'Modifier la section « B »')

    expect(editorRegion('Édition de la section « B »')).toHaveClass('print:hidden')
    expect(screen.getByRole('button', { name: 'Modifier la section « A »' })).toHaveClass('print:hidden')
    expect(container.querySelector('[data-section-index="2"]')).toHaveClass('hidden', 'print:block')
  })

  it('closes the editor when navigating to another card and back', async () => {
    function GoTo({ to }: { to: string }) {
      const navigate = useNavigate()
      return <button onClick={() => navigate(to)}>{`Aller ${to}`}</button>
    }
    vi.mocked(fetchFlashCard).mockImplementation(async (cardId) =>
      fullCard(cardId === 'fc-1' ? C : '## Autre\n\nx', { id: cardId }),
    )
    renderPage(<><GoTo to="/flashcards/fc-2" /><GoTo to="/flashcards/fc-1" /></>)

    fireEvent.click(await screen.findByRole('button', { name: 'Modifier la section « B »' }))
    expect(screen.getByRole('textbox', { name: 'Markdown de la section' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Aller /flashcards/fc-2' }))
    await screen.findByRole('button', { name: 'Modifier la section « Autre »' })
    expect(screen.queryByRole('textbox', { name: 'Markdown de la section' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Aller /flashcards/fc-1' }))
    await screen.findByRole('button', { name: 'Modifier la section « B »' })
    expect(screen.queryByRole('textbox', { name: 'Markdown de la section' })).not.toBeInTheDocument()
  })

  it('closes the editor when the content changes from outside', async () => {
    const { queryClient } = await openSection(C, 'Modifier la section « B »')

    act(() => {
      queryClient.setQueryData(['flashcards', 'fc-1'], fullCard('autre'))
    })

    await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Markdown de la section' })).not.toBeInTheDocument())
  })

  it('disables Remplacer while editing', async () => {
    await openSection(C, 'Modifier la section « B »')

    expect(screen.getByRole('button', { name: 'Remplacer' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.getByRole('button', { name: 'Remplacer' })).toBeEnabled()
  })

  it('prevents unloading only with an unsaved draft', async () => {
    const { textarea } = await openSection(C, 'Modifier la section « B »')

    const clean = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(clean)
    expect(clean.defaultPrevented).toBe(false)

    fireEvent.change(textarea, { target: { value: '## B\n\nx' } })
    const modified = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(modified)
    expect(modified.defaultPrevented).toBe(true)
  })

  it('closes with Escape when unchanged and asks when modified', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { textarea } = await openSection(C, 'Modifier la section « B »')

    fireEvent.change(textarea, { target: { value: '## B\n\nx' } })
    fireEvent.keyDown(textarea, { key: 'Escape' })
    expect(confirm).toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: 'Markdown de la section' })).toBeInTheDocument()

    fireEvent.change(textarea, { target: { value: '## B\n\nTexte B' } })
    confirm.mockClear()
    fireEvent.keyDown(textarea, { key: 'Escape' })
    expect(confirm).not.toHaveBeenCalled()
    expect(screen.queryByRole('textbox', { name: 'Markdown de la section' })).not.toBeInTheDocument()
  })

  it.each([{ ctrlKey: true }, { metaKey: true }])('saves with the keyboard shortcut %j', async (modifier) => {
    vi.mocked(updateFlashCard).mockReturnValue(new Promise(() => {}))
    const { textarea } = await openSection(C, 'Modifier la section « B »')

    fireEvent.keyDown(textarea, { key: 'Enter', ...modifier })
    expect(updateFlashCard).not.toHaveBeenCalled()

    fireEvent.change(textarea, { target: { value: '## B\n\nx' } })
    fireEvent.keyDown(textarea, { key: 'Enter', ...modifier })
    await waitFor(() => expect(updateFlashCard).toHaveBeenCalledTimes(1))
  })

  it('keeps the table of contents links unchanged', async () => {
    vi.mocked(fetchFlashCard).mockResolvedValue(fullCard(contentWithToc))
    renderPage()

    const nav = await screen.findByRole('navigation', { name: 'Sommaire' })
    await waitFor(() => expect(within(nav).getAllByRole('link')).toHaveLength(2))
    fireEvent.click(screen.getByRole('button', { name: 'Modifier la section « Détails »' }))

    const links = within(nav).getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['#introduction', '#détails'])
    links.forEach((link) => expect(link.textContent).not.toMatch(/Modifier/))
  })
})
