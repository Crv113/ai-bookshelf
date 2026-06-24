import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchFlashCard, deleteFlashCard } from '../api/flashcards'
import MarkdownRenderer from '../components/MarkdownRenderer'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function FlashCardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)

  const { data: card, isLoading, isError } = useQuery({
    queryKey: ['flashcards', id],
    queryFn: () => fetchFlashCard(id!),
    enabled: Boolean(id),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteFlashCard(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
      navigate('/')
    },
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
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Retour
        </Link>

        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">Supprimer définitivement ?</span>
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white transition-colors hover:bg-red-700 disabled:opacity-50 hover:cursor-pointer"
            >
              {deleteMutation.isPending ? 'Suppression…' : 'Confirmer'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className=" py-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors hover:cursor-pointer"
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-red-500 transition-colors hover:cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            Supprimer
          </button>
        )}
      </div>

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

      <div className="rounded-none lg:rounded-2xl p-0 lg:p-8 max-w-2xl overflow-hidden -mx-4 lg:mx-0 bg-card">
        <MarkdownRenderer content={card.content} />
      </div>
    </div>
  )
}
