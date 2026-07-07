export interface Category {
  id: string
  name: string
  createdAt: string
  flashCardCount: number
}

export interface CategoryCreatePayload {
  name: string
}
