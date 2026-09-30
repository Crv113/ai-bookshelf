interface FlashCardMeta {
  createdAt: string
  model: string | null
  estimatedTime: number | null
}

export function formatFlashCardMeta({ createdAt, model, estimatedTime }: FlashCardMeta): string {
  const date = new Date(createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
  const readingTime = estimatedTime ? `${estimatedTime} min` : null

  return [date, model, readingTime].filter(Boolean).join(' - ')
}
