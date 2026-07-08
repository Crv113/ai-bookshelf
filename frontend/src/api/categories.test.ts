import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchCategories, fetchCategoryById, createCategory } from './categories'

describe('categories api', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetchCategories', () => {
    it('returns the parsed category list on success', async () => {
      const categories = [{ id: '1', name: 'Java', createdAt: '2026-01-01', flashCardCount: 3 }]
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => categories }))

      const result = await fetchCategories()

      expect(result).toEqual(categories)
      expect(fetch).toHaveBeenCalledWith('/api/categories')
    })

    it('throws when the response is not ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

      await expect(fetchCategories()).rejects.toThrow(/500/)
    })
  })

  describe('fetchCategoryById', () => {
    it('returns the category on success', async () => {
      const category = { id: '1', name: 'Java', createdAt: '2026-01-01', flashCardCount: 3 }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => category }))

      const result = await fetchCategoryById('1')

      expect(result).toEqual(category)
      expect(fetch).toHaveBeenCalledWith('/api/categories/1')
    })

    it('throws when the category does not exist (404)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))

      await expect(fetchCategoryById('missing-id')).rejects.toThrow(/404/)
    })
  })

  describe('createCategory', () => {
    it('posts the payload and returns the created category', async () => {
      const created = { id: '2', name: 'Spring', createdAt: '2026-01-02', flashCardCount: 0 }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => created }))

      const result = await createCategory({ name: 'Spring' })

      expect(result).toEqual(created)
    })
  })
})
