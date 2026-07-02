export interface FlashCardSummary {
  id: string
  title: string
  createdAt: string
  summary: string
}

export interface FlashCardResponse {
  id: string
  title: string
  createdAt: string
  summary: string
  content: string
  categoryId: string

}

export interface FlashCardCreatePayload {
  title: string
  summary: string
  content: string
  categoryId: string
}
