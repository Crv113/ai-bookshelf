import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchFlashCard } from '../api/flashcards'
import MarkdownRenderer from '../components/MarkdownRenderer'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function FlashCardDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: card, isLoading, isError } = useQuery({
    queryKey: ['flashcards', id],
    queryFn: () => fetchFlashCard(id!),
    enabled: Boolean(id),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
        Chargement…
      </div>
    )
  }

  if (isError || !card) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-red-500">Flashcard introuvable.</p>
        <Link to="/" className="text-sm hover:underline text-brand">
          ← Retour à la liste
        </Link>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 lg:px-12 lg:py-10 max-w-3xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors mb-8"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        Retour
      </Link>

      <header className="mb-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
          Fiche de révision
        </p>
        <h1 className="font-display text-3xl font-bold text-stone-900 leading-snug mb-3">
          {card.title}
        </h1>
        <p className="text-xs text-stone-400">{formatDate(card.createdAt)}</p>
        {card.summary && (
          <div className="mt-4 pl-4" style={{ borderLeft: '2px solid rgba(196,116,42,0.4)' }}>
            <p className="text-sm text-stone-600 leading-relaxed italic">{card.summary}</p>
          </div>
        )}
      </header>

      <hr className="border-stone-200/70 mb-8 max-w-2xl" />

      <div
        className="rounded-none lg:rounded-2xl p-0 lg:p-8 max-w-2xl overflow-hidden -mx-4 lg:mx-0 bg-card"
      >
        <MarkdownRenderer content={card.content} />
      </div>
    </div>
  )
}
