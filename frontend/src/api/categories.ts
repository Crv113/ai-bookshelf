import type { Category, CategoryCreatePayload } from '../types/category'

const BASE = '/api/categories'

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(BASE)
  if (!res.ok) throw new Error(`Erreur ${res.status} lors du chargement des catégories`)
  return res.json()
}

export async function createCategory(payload: CategoryCreatePayload): Promise<Category> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string })?.message ?? `Erreur ${res.status} lors de la création`)
  }
  return res.json()
}
