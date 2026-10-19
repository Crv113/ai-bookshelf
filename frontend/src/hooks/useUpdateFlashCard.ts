import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult } from '@tanstack/react-query'
import { updateFlashCard } from '../api/flashcards'
import type { FlashCardResponse, FlashCardUpdatePayload } from '../types/flashcard'

export function useUpdateFlashCard(
  card: Pick<FlashCardResponse, 'id' | 'categoryId'>,
): UseMutationResult<FlashCardResponse, Error, FlashCardUpdatePayload> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: FlashCardUpdatePayload) => updateFlashCard(card.id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['flashcards', card.id], updated)
      queryClient.invalidateQueries({ queryKey: ['flashcards'], exact: true })
      queryClient.invalidateQueries({ queryKey: ['flashcards', 'category', card.categoryId] })
    },
  })
}
