import type { FlashCardSummary, FlashCardResponse, FlashCardCreatePayload } from '../types/flashcard'

const BASE = '/api/flashcards'

export async function fetchFlashCards(): Promise<FlashCardSummary[]> {
  const res = await fetch(BASE)
  if (!res.ok) throw new Error(`Erreur ${res.status} lors du chargement des flashcards`)
  return res.json()
}

export async function fetchFlashCard(id: string): Promise<FlashCardResponse> {
  const res = await fetch(`${BASE}/${id}`)
  if (!res.ok) throw new Error(`Erreur ${res.status} — flashcard introuvable`)
  return res.json()
}

export async function createFlashCard(payload: FlashCardCreatePayload): Promise<FlashCardResponse> {
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
