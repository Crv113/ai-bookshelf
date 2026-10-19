import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import MarkdownRenderer from './MarkdownRenderer'

interface SectionEditorProps {
  regionLabel: string
  initialText: string
  saving: boolean
  error: string | null
  onDirtyChange: (dirty: boolean) => void
  onCancel: () => void
  onSave: (draft: string) => void
}

type EditorMode = 'edit' | 'preview'

export default function SectionEditor({
  regionLabel,
  initialText,
  saving,
  error,
  onDirtyChange,
  onCancel,
  onSave,
}: SectionEditorProps) {
  const [draft, setDraft] = useState(initialText)
  const [mode, setMode] = useState<EditorMode>('edit')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mountedRef = useRef(false)
  const dirty = draft !== initialText

  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta || mode !== 'edit') return
    ta.focus({ preventScroll: true })
    if (!mountedRef.current) {
      ta.setSelectionRange(0, 0)
      mountedRef.current = true
    }
  }, [mode])

  useLayoutEffect(() => {
    const ta = textareaRef.current
    if (!ta || mode !== 'edit') return
    const y = window.scrollY
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight + 2}px`
    if (window.scrollY !== y) window.scrollTo(0, y)
  }, [draft, mode])

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      if (!saving) onCancel()
      return
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (dirty && !saving) onSave(draft)
    }
  }

  const toggleClass = (active: boolean) =>
    `px-3 py-1 text-xs rounded-lg transition-colors hover:cursor-pointer ${active ? 'bg-stone-200 text-stone-800' : 'text-stone-500 hover:text-stone-800'}`

  return (
    <div
      role="region"
      aria-label={regionLabel}
      className="not-prose print:hidden my-6 rounded-xl border border-stone-200 bg-surface p-4 flex flex-col gap-3"
      onKeyDown={handleKeyDown}
    >
      <div className="flex gap-2">
        <button type="button" aria-pressed={mode === 'edit'} onClick={() => setMode('edit')} className={toggleClass(mode === 'edit')}>
          Édition
        </button>
        <button type="button" aria-pressed={mode === 'preview'} onClick={() => setMode('preview')} className={toggleClass(mode === 'preview')}>
          Aperçu
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        hidden={mode === 'preview'}
        aria-label="Markdown de la section"
        spellCheck={false}
        rows={8}
        className="w-full font-mono text-xs leading-relaxed max-h-[70vh] overflow-y-auto resize-y rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand/20"
      />

      {mode === 'preview' && (
        draft.trim() === '' ? (
          <p className="text-xs text-stone-400">Rien à afficher.</p>
        ) : (
          <div className="rounded-lg border border-stone-200 bg-card">
            <MarkdownRenderer content={draft} headingIds={false} />
          </div>
        )
      )}

      <p className="text-xs text-stone-400">
        Modifier ou supprimer la ligne « ## … » change le découpage de la fiche ; ajouter un « ## » crée une nouvelle section. Ctrl/⌘ + Entrée pour enregistrer, Échap pour annuler.
      </p>

      {error && (
        <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 text-sm text-stone-500 hover:text-stone-800 transition-colors disabled:opacity-50 hover:cursor-pointer"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={() => onSave(draft)}
          disabled={saving || !dirty}
          className="px-5 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 bg-brand text-on-brand hover:bg-brand-hover hover:cursor-pointer"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
