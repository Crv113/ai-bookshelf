import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchFlashCards } from '../api/flashcards'
import { UploadIcon } from '../components/icons/icons'

interface FlashCardListPageProps {
  onImport: () => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function BookIcon() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#5C1B1B">
      <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 14H8v-2h8v2zm0-4H8v-2h8v2zm0-4H8V6h8v2z"/>
    </svg>
  )
}

function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div
        className="rounded-2xl px-12 py-10 flex flex-col items-center text-center max-w-md w-full bg-card"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-warm"
        >
          <BookIcon />
        </div>
        <h3 className="font-display text-lg font-semibold text-stone-800 mb-2">
          Commencez par importer une conversation
        </h3>
        <p className="text-sm text-stone-500 leading-relaxed mb-6">
          Importez un JSON exporté depuis ChatGPT ou Claude grâce au prompt fourni.
          <br />
          Chaque résumé deviendra une fiche de révision élégante, que vous pourrez classer par catégorie.
        </p>
        <button
          onClick={onImport}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors bg-brand text-on-brand hover:bg-brand-hover hover:cursor-pointer"
        >
          <UploadIcon />
          Importer mon premier JSON
        </button>
      </div>
    </div>
  )
}

export default function FlashCardListPage({ onImport }: FlashCardListPageProps) {
  const { data: flashCards = [], isLoading, isError } = useQuery({
    queryKey: ['flashcards'],
    queryFn: fetchFlashCards,
  })

  const isEmpty = !isLoading && !isError && flashCards.length === 0

  return (
    <div className="min-h-full px-4 py-6 lg:px-12 lg:py-10 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
            Ma bibliothèque
          </p>
          <h1 className="font-display text-4xl font-bold text-stone-900 leading-tight">
            {isEmpty ? 'Une étagère vide attend vos savoirs' : 'Toutes les fiches'}
          </h1>
        </div>
        {!isEmpty && (
          <button
            onClick={onImport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shrink-0 mt-2 bg-brand text-on-brand hover:bg-brand-hover hover:cursor-pointer"
          >
            <UploadIcon />
            Importer un JSON
          </button>
        )}
      </div>

      <hr className="border-stone-200/70 mb-8" />

      {isLoading && (
        <div className="flex justify-center py-20 text-stone-400 text-sm">Chargement…</div>
      )}

      {isError && (
        <div className="flex justify-center py-20 text-red-500 text-sm">
          Impossible de charger les flashcards.
        </div>
      )}

      {isEmpty && <EmptyState onImport={onImport} />}

      {!isLoading && !isError && flashCards.length > 0 && (
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
