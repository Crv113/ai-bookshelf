export interface FlashCardSummary {
  id: string
  title: string
  createdAt: string
  summary: string
  model: string | null
  estimatedTime: number | null
}

export interface FlashCardResponse {
  id: string
  title: string
  createdAt: string
  summary: string
  content: string
  model: string | null
  estimatedTime: number | null
  categoryId: string

}

export interface FlashCardCreatePayload {
  title: string
  summary: string
  content: string
  model: string
  estimatedTime: number
  categoryId: string
}
