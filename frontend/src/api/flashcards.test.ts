import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchFlashCards, fetchFlashCard, fetchFlashCardsByCategory } from './flashcards'

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
})
