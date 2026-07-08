import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { fetchCategoryById } from '../api/categories'
import { fetchFlashCardsByCategory } from '../api/flashcards'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function CategoryFlashCardsPage() {
  const { id } = useParams<{ id: string }>()

  const { data: category, isLoading: categoryLoading, isError: categoryError } = useQuery({
    queryKey: ['categories', id],
    queryFn: () => fetchCategoryById(id!),
    enabled: Boolean(id),
  })

  const { data: flashCards = [], isLoading: flashCardsLoading, isError: flashCardsError } = useQuery({
    queryKey: ['flashcards', 'category', id],
    queryFn: () => fetchFlashCardsByCategory(id!),
    enabled: Boolean(id),
  })

  const isLoading = categoryLoading || flashCardsLoading
  const isNotFound = categoryError || flashCardsError || !category

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
        Chargement…
      </div>
    )
  }

  if (isNotFound) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-red-500">Catégorie introuvable.</p>
        <Link to="/" className="text-sm hover:underline text-brand">
          ← Retour à la liste
        </Link>
      </div>
    )
  }

  const isEmpty = flashCards.length === 0

  return (
    <div className="min-h-full px-4 py-6 lg:px-12 lg:py-10 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
            Catégorie
          </p>
          <h1 className="font-display text-4xl font-bold text-stone-900 leading-tight">
            {category.name}
          </h1>
        </div>
      </div>

      <hr className="border-stone-200/70 mb-8" />

      {isEmpty ? (
        <div className="flex justify-center py-20 text-stone-400 text-sm">
          Aucune flashcard dans cette catégorie.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 max-w-2xl">
          {flashCards.map((card) => (
            <li key={card.id}>
              <Link
                to={`/flashcards/${card.id}`}
                className="group block rounded-xl p-5 transition-all bg-card hover:bg-card-hover"
              >
                <h3 className="font-display font-semibold text-stone-900 mb-1 transition-colors group-hover:text-brand">
                  {card.title}
                </h3>
                <p className="text-sm text-stone-500 line-clamp-2 leading-relaxed">{card.summary}</p>
                <p className="text-xs text-stone-400 mt-3">{formatDate(card.createdAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
