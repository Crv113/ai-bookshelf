import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ImportModal from './ImportModal'
import { createFlashCard } from '../api/flashcards'
import { fetchCategories } from '../api/categories'

vi.mock('../api/flashcards', () => ({
  createFlashCard: vi.fn(),
}))

vi.mock('../api/categories', () => ({
  fetchCategories: vi.fn(),
  createCategory: vi.fn(),
}))

const validJson = JSON.stringify({
  title: 'Titre',
  summary: 'Résumé',
  model: 'Claude Opus 5.5',
  content: '## Section',
  estimated_time: '12',
})

function renderModal() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ImportModal open onClose={vi.fn()} />
    </QueryClientProvider>
  )
}

function typeJson(value: string) {
  fireEvent.change(screen.getByRole('textbox'), { target: { value } })
}

describe('ImportModal', () => {
  beforeEach(() => {
    vi.mocked(createFlashCard).mockReset()
    vi.mocked(fetchCategories).mockResolvedValue([
      { id: 'cat-1', name: 'Java', createdAt: '2026-01-01', flashCardCount: 0 },
    ])
  })

  it('shows an error and does not submit a malformed JSON', () => {
    renderModal()
    typeJson('{ "title": ')
    fireEvent.click(screen.getByRole('button', { name: 'Importer' }))

    expect(screen.getByText('JSON invalide. Vérifiez la syntaxe.')).toBeInTheDocument()
    expect(createFlashCard).not.toHaveBeenCalled()
  })

  it('shows an error and does not submit a JSON with missing fields', () => {
    renderModal()
    typeJson(JSON.stringify({ title: 'Titre' }))
    fireEvent.click(screen.getByRole('button', { name: 'Importer' }))

    expect(screen.getByText('Le JSON doit contenir title, summary, content, model et estimated_time.')).toBeInTheDocument()
    expect(createFlashCard).not.toHaveBeenCalled()
  })

  it('asks for a category when none is selected', () => {
    renderModal()
    typeJson(validJson)
    fireEvent.click(screen.getByRole('button', { name: 'Importer' }))

    expect(screen.getByText('Sélectionnez une catégorie.')).toBeInTheDocument()
    expect(createFlashCard).not.toHaveBeenCalled()
  })

  it('creates the flashcard with the selected category', async () => {
    vi.mocked(createFlashCard).mockResolvedValue({
      id: 'fc-1',
      title: 'Titre',
      createdAt: '2026-01-01',
      summary: 'Résumé',
      content: '## Section',
      model: 'Claude Opus 5.5',
      estimatedTime: 12,
      categoryId: 'cat-1',
    })
    renderModal()
    await screen.findByRole('option', { name: 'Java' })
    typeJson(validJson)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'cat-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Importer' }))

    await waitFor(() => expect(createFlashCard).toHaveBeenCalled())
    expect(vi.mocked(createFlashCard).mock.calls[0][0]).toEqual({
      title: 'Titre',
      summary: 'Résumé',
      content: '## Section',
      model: 'Claude Opus 5.5',
      estimatedTime: 12,
      categoryId: 'cat-1',
    })
  })
})
