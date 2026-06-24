import { useState } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { createFlashCard } from '../api/flashcards'
import type { FlashCardCreatePayload } from '../types/flashcard'

interface ImportModalProps {
  open: boolean
  onClose: () => void
}

export default function ImportModal({ open, onClose }: ImportModalProps) {
  const [json, setJson] = useState('')
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: createFlashCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
      setJson('')
      setError(null)
      onClose()
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let payload: FlashCardCreatePayload
    try {
      payload = JSON.parse(json)
    } catch {
      setError('JSON invalide. Vérifiez la syntaxe.')
      return
    }
    if (!payload.title || !payload.summary || !payload.content) {
      setError('Le JSON doit contenir title, summary et content.')
      return
    }
    setError(null)
    mutation.mutate(payload)
  }

  function handleClose() {
    setJson('')
    setError(null)
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
        className="relative rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-7"
        style={{ backgroundColor: '#FAF7F2' }}
      >
        <div className="mb-5">
          <h2 className="font-display text-xl font-semibold text-stone-900">Importer une flashcard</h2>
          <p className="text-sm text-stone-500 mt-1 leading-relaxed">
            Collez votre JSON ci-dessous. Il sera envoyé directement au backend.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={10}
            spellCheck={false}
            autoFocus
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-xs font-mono text-stone-800 placeholder-stone-300 resize-none focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ focusRingColor: '#5C1B1B' } as React.CSSProperties}
            onFocus={(e) => { e.target.style.borderColor = '#5C1B1B'; e.target.style.boxShadow = '0 0 0 2px rgba(92,27,27,0.15)' }}
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
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#5C1B1B', color: '#F5EDE8' }}
              onMouseEnter={(e) => { (e.currentTarget.style.backgroundColor = '#7A2828') }}
              onMouseLeave={(e) => { (e.currentTarget.style.backgroundColor = '#5C1B1B') }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
              </svg>
              {mutation.isPending ? 'Import…' : 'Importer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
