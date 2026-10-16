import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchFlashCards, fetchFlashCard, fetchFlashCardsByCategory, updateFlashCard } from './flashcards'

describe('flashcards api', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetchFlashCards', () => {
    it('returns the parsed flashcard list on success', async () => {
      const cards = [{ id: '1', title: 'Titre', createdAt: '2026-01-01', summary: 'Résumé' }]
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => cards }))

      const result = await fetchFlashCards()

      expect(result).toEqual(cards)
    })
  })

  describe('fetchFlashCard', () => {
    it('throws when the flashcard is not found', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))

      await expect(fetchFlashCard('missing-id')).rejects.toThrow(/introuvable/)
    })
  })

  describe('fetchFlashCardsByCategory', () => {
    it('returns an empty array when the category has no flashcards', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))

      const result = await fetchFlashCardsByCategory('cat-1')

      expect(result).toEqual([])
      expect(fetch).toHaveBeenCalledWith('/api/flashcards/category/cat-1')
    })

    it('returns the flashcards of the category on success', async () => {
      const cards = [{ id: '1', title: 'Titre', createdAt: '2026-01-01', summary: 'Résumé' }]
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => cards }))

      const result = await fetchFlashCardsByCategory('cat-1')

      expect(result).toEqual(cards)
    })

    it('throws when the category does not exist (404)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))

      await expect(fetchFlashCardsByCategory('missing-category')).rejects.toThrow(/introuvable/)
    })
  })

  describe('updateFlashCard', () => {
    const payload = {
      title: 'Titre',
      summary: 'Résumé',
      content: '## A',
      model: 'Claude Opus 5.5',
      estimatedTime: 12,
      categoryId: 'cat-1',
    }

    it('sends a PUT request and returns the parsed flashcard', async () => {
      const updated = { id: 'fc-1', createdAt: '2026-01-01', ...payload }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => updated }))

      const result = await updateFlashCard('fc-1', payload)

      expect(fetch).toHaveBeenCalledWith('/api/flashcards/fc-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      expect(result).toEqual(updated)
    })

    it('rejects with the API error message', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'FlashCard with ID fc-1 not found.' }),
      }))

      await expect(updateFlashCard('fc-1', payload)).rejects.toThrow('FlashCard with ID fc-1 not found.')
    })

    it('rejects with a fallback message when the body is unreadable', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => { throw new Error('invalid') },
      }))

      await expect(updateFlashCard('fc-1', payload)).rejects.toThrow('Erreur 500 lors de la mise à jour')
    })
  })
})
