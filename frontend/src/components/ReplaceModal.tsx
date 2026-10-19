import { useId, useState } from 'react'
import { useUpdateFlashCard } from '../hooks/useUpdateFlashCard'
import type { FlashCardResponse } from '../types/flashcard'
import { parseImportJson } from '../utils/importJson'

interface ReplaceModalProps {
  open: boolean
  onClose: () => void
  card: FlashCardResponse
}

export default function ReplaceModal({ open, onClose, card }: ReplaceModalProps) {
  const [json, setJson] = useState('')
  const [error, setError] = useState<string | null>(null)
  const titleId = useId()

  function reset() {
    setJson('')
    setError(null)
  }

  const mutation = useUpdateFlashCard(card)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = parseImportJson(json)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    mutation.mutate(
      { ...result.data, categoryId: card.categoryId },
      {
        onSuccess: () => {
          reset()
          onClose()
        },
        onError: (err) => setError(err.message),
      },
    )
  }

  function handleClose() {
    reset()
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-7 bg-surface"
      >
        <div className="mb-5">
          <h2 id={titleId} className="font-display text-xl font-semibold text-stone-900">Remplacer la fiche</h2>
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3 leading-relaxed">
            Le contenu actuel de la fiche sera définitivement écrasé. Aucun historique n'est conservé. Pensez à copier le JSON actuel avant de remplacer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            aria-label="JSON de la fiche"
            rows={10}
            spellCheck={false}
            autoFocus
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-xs font-mono text-stone-800 placeholder-stone-300 resize-none focus:outline-none focus:ring-2 focus:border-transparent"
            onFocus={(e) => { e.target.style.borderColor = 'var(--color-brand)'; e.target.style.boxShadow = '0 0 0 2px rgba(92,27,27,0.15)' }}
            onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
            placeholder={'{\n  "title": "...",\n  "summary": "...",\n  "content": "# Titre\\n\\nContenu..."\n}'}
          />

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm text-stone-500 hover:text-stone-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !json.trim()}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 bg-brand text-on-brand hover:bg-brand-hover"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
              </svg>
              {mutation.isPending ? 'Remplacement…' : 'Remplacer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
