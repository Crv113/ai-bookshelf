import { useState } from 'react'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { createFlashCard } from '../api/flashcards'
import { fetchCategories, createCategory } from '../api/categories'
import type { FlashCardCreatePayload } from '../types/flashcard'
import { IMPORT_PROMPT } from '../constants/importPrompt'
import { CopyIcon } from './icons/icons'

interface ImportModalProps {
  open: boolean
  onClose: () => void
}

export default function ImportModal({ open, onClose }: ImportModalProps) {
  const [json, setJson] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const queryClient = useQueryClient()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    enabled: open,
  })

  async function handleCopyPrompt() {
    await navigator.clipboard.writeText(IMPORT_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const mutation = useMutation({
    mutationFn: createFlashCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
      setJson('')
      setCategoryId('')
      setError(null)
      onClose()
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setCategoryId(category.id)
      setNewCategoryName('')
      setCreatingCategory(false)
      setError(null)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    createCategoryMutation.mutate({ name: newCategoryName.trim() })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let parsed: Partial<FlashCardCreatePayload>
    try {
      parsed = JSON.parse(json)
    } catch {
      setError('JSON invalide. Vérifiez la syntaxe.')
      return
    }
    if (!parsed.title || !parsed.summary || !parsed.content) {
      setError('Le JSON doit contenir title, summary et content.')
      return
    }
    if (!categoryId) {
      setError('Sélectionnez une catégorie.')
      return
    }
    setError(null)
    mutation.mutate({ title: parsed.title, summary: parsed.summary, content: parsed.content, categoryId })
  }

  function handleClose() {
    setJson('')
    setCategoryId('')
    setCreatingCategory(false)
    setNewCategoryName('')
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
        className="relative rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-7 bg-surface"
      >
        <div className="mb-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-stone-900">Importer une fiche de révision</h2>
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 bg-brand text-on-brand hover:bg-brand-hover hover:cursor-pointer"
            >
              <CopyIcon />
              {copied ? 'Copié !' : 'Copier le prompt'}
            </button>
          </div>
          <p className="text-sm text-stone-500 mt-1 leading-relaxed">
            Copiez le prompt ci-dessus et utilisez-le dans votre application IA pour générer un résumé de cours au format JSON. Ensuite, collez ce JSON dans le champ ci-dessous pour créer une fiche de révision.
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
            onFocus={(e) => { e.target.style.borderColor = 'var(--color-brand)'; e.target.style.boxShadow = '0 0 0 2px rgba(92,27,27,0.15)' }}
            onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
            placeholder={'{\n  "title": "...",\n  "summary": "...",\n  "content": "# Titre\\n\\nContenu..."\n}'}
          />

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-stone-600">Catégorie</label>
            {!creatingCategory ? (
              <div className="flex gap-2">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:border-transparent"
                  onFocus={(e) => { e.target.style.borderColor = 'var(--color-brand)'; e.target.style.boxShadow = '0 0 0 2px rgba(92,27,27,0.15)' }}
                  onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
                >
                  <option value="">Sélectionner une catégorie…</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setCreatingCategory(true)}
                  className="px-3 py-2 text-xs font-medium rounded-lg transition-colors shrink-0 bg-stone-100 text-stone-700 hover:bg-stone-200 hover:cursor-pointer"
                >
                  + Nouvelle
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nom de la catégorie"
                  autoFocus
                  className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:border-transparent"
                  onFocus={(e) => { e.target.style.borderColor = 'var(--color-brand)'; e.target.style.boxShadow = '0 0 0 2px rgba(92,27,27,0.15)' }}
                  onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
                  className="px-3 py-2 text-xs font-medium rounded-lg transition-colors shrink-0 disabled:opacity-50 bg-brand text-on-brand hover:bg-brand-hover hover:cursor-pointer"
                >
                  {createCategoryMutation.isPending ? '…' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => { setCreatingCategory(false); setNewCategoryName('') }}
                  className="px-3 py-2 text-xs text-stone-500 hover:text-stone-800 transition-colors shrink-0"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>

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
              {mutation.isPending ? 'Import…' : 'Importer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
