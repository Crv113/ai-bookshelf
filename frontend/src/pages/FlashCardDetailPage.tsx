import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchFlashCard, deleteFlashCard } from '../api/flashcards'
import MarkdownRenderer from '../components/MarkdownRenderer'
import TableOfContents from '../components/TableOfContents'
import ReplaceModal from '../components/ReplaceModal'
import SectionEditor from '../components/SectionEditor'
import { useUpdateFlashCard } from '../hooks/useUpdateFlashCard'
import { applySectionEdit, getEditableText, splitSections } from '../utils/markdownSections'
import type { MarkdownSection } from '../utils/markdownSections'
import { ChevronIcon, CloseIcon, CopyIcon, ListIcon, QuizIcon, UploadIcon } from '../components/icons/icons'
import { formatFlashCardMeta } from '../utils/formatFlashCardMeta'
import { useTocHeadings } from '../hooks/useTocHeadings'
import { useActiveHeading } from '../hooks/useActiveHeading'
import { toImportJson } from '../utils/importJson'
import { buildQuizPrompt } from '../constants/quizPrompt'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'
import type { CopyStatus } from '../hooks/useCopyToClipboard'

const COPY_JSON_LABELS: Record<CopyStatus, string> = {
  idle: 'Copier JSON',
  copied: 'Copié',
  failed: 'Échec de la copie',
}

const COPY_MCQ_QUIZ_LABELS: Record<CopyStatus, string> = {
  idle: 'Quiz QCM',
  copied: 'Copié',
  failed: 'Échec de la copie',
}

const COPY_OPEN_QUIZ_LABELS: Record<CopyStatus, string> = {
  idle: 'Quiz libre',
  copied: 'Copié',
  failed: 'Échec de la copie',
}

const MISSING_META_ERROR = "Impossible d'enregistrer : le modèle et la durée estimée doivent être renseignés (utilisez « Remplacer par un JSON »)."
const EMPTY_CONTENT_ERROR = 'La fiche ne peut pas être vide.'
const DISCARD_CONFIRM = 'Abandonner les modifications non enregistrées de cette section ?'

interface EditingState {
  cardId: string
  index: number
  baseContent: string
}

function editorRegionLabel(section: MarkdownSection): string {
  if (section.kind === 'intro') return "Édition de l'introduction"
  return `Édition de la section « ${section.headingText || 'sans titre'} »`
}

export default function FlashCardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [copyJsonStatus, copyJson] = useCopyToClipboard()
  const [copyMcqQuizStatus, copyMcqQuiz] = useCopyToClipboard()
  const [copyOpenQuizStatus, copyOpenQuiz] = useCopyToClipboard()

  const { data: card, isLoading, isError } = useQuery({
    queryKey: ['flashcards', id],
    queryFn: () => fetchFlashCard(id!),
    enabled: Boolean(id),
  })

  const contentRef = useRef<HTMLDivElement>(null)
  const items = useTocHeadings(contentRef, card?.content)
  const ids = useMemo(() => items.map((item) => item.id), [items])
  const [activeId, setActiveId] = useActiveHeading(ids)
  const [tocCollapsed, setTocCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const hasToc = items.length >= 2

  const [editing, setEditing] = useState<EditingState | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [restoreIndex, setRestoreIndex] = useState<number | null>(null)
  const savingRef = useRef(false)
  const updateMutation = useUpdateFlashCard({ id: id ?? '', categoryId: card?.categoryId ?? '' })
  const sections = useMemo(() => splitSections(card?.content ?? ''), [card?.content])
  const currentEditing = editing && card && editing.cardId === card.id && editing.baseContent === card.content ? editing : null
  const hasUnsavedDraft = currentEditing !== null && dirty

  useEffect(() => {
    setDrawerOpen(false)
    setActiveId(null)
    setEditing(null)
    setDirty(false)
    setSaveError(null)
  }, [id, setActiveId])

  useEffect(() => {
    if (!hasUnsavedDraft) return
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedDraft])

  useLayoutEffect(() => {
    if (restoreIndex === null) return
    if (sections.length === 0) {
      setRestoreIndex(null)
      return
    }
    const target = Math.min(restoreIndex, sections.length - 1)
    const el = contentRef.current?.querySelector<HTMLElement>(`[data-section-index="${target}"]`)
    if (el && el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ block: 'start', behavior: 'instant' })
    }
    el?.querySelector<HTMLElement>('[data-section-edit]')?.focus({ preventScroll: true })
    setRestoreIndex(null)
  }, [restoreIndex, sections.length])

  useEffect(() => {
    if (!drawerOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [drawerOpen])

  const deleteMutation = useMutation({
    mutationFn: () => deleteFlashCard(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      navigate('/')
    },
  })

  function handleEditSection(index: number) {
    if (!card || updateMutation.isPending || currentEditing?.index === index) return
    if (hasUnsavedDraft && !window.confirm(DISCARD_CONFIRM)) return
    setSaveError(null)
    setDirty(false)
    setEditing({ cardId: card.id, index, baseContent: card.content })
  }

  function closeEditor(index: number) {
    setEditing(null)
    setDirty(false)
    setSaveError(null)
    setRestoreIndex(index)
  }

  function handleCancel() {
    if (!currentEditing) return
    if (dirty && !window.confirm(DISCARD_CONFIRM)) return
    closeEditor(currentEditing.index)
  }

  function handleSave(draft: string) {
    if (savingRef.current || !card || !currentEditing) return
    setSaveError(null)
    const { model, estimatedTime } = card
    if (!model?.trim() || estimatedTime === null || estimatedTime <= 0) {
      setSaveError(MISSING_META_ERROR)
      return
    }
    const { index, baseContent } = currentEditing
    const content = applySectionEdit(baseContent, index, draft)
    if (!content.trim()) {
      setSaveError(EMPTY_CONTENT_ERROR)
      return
    }
    savingRef.current = true
    updateMutation.mutate(
      { title: card.title, summary: card.summary, model, estimatedTime, categoryId: card.categoryId, content },
      {
        onSuccess: () => closeEditor(index),
        onError: (err) => setSaveError(err.message),
        onSettled: () => {
          savingRef.current = false
        },
      },
    )
  }

  // Le titre du document sert de nom de fichier par défaut dans « Enregistrer en PDF »
  function handleExportPdf() {
    if (!card) return
    const previousTitle = document.title
    document.title = card.title
    window.print()
    document.title = previousTitle
  }

  function handleCopyJson() {
    if (card) copyJson(toImportJson(card))
  }

  function handleCopyMcqQuizPrompt() {
    if (card) copyMcqQuiz(buildQuizPrompt(card, 'mcq'))
  }

  function handleCopyOpenQuizPrompt() {
    if (card) copyOpenQuiz(buildQuizPrompt(card, 'open'))
  }

  function navigateTo(headingId: string) {
    document.getElementById(headingId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveId(headingId)
  }

  function navigateFromDrawer(headingId: string) {
    setDrawerOpen(false)
    requestAnimationFrame(() => navigateTo(headingId))
  }

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
    <div className={`px-4 py-6 lg:px-12 lg:py-10 max-w-4xl mx-auto print:p-0 print:max-w-none${hasToc ? ' xl:max-w-6xl' : ''}`}>
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Retour
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={handleCopyJson}
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors hover:cursor-pointer"
          >
            <CopyIcon />
            {COPY_JSON_LABELS[copyJsonStatus]}
          </button>

          <button
            onClick={handleCopyMcqQuizPrompt}
            title="Copier un prompt pour qu'une IA me fasse passer un QCM de 30 questions sur cette fiche"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors hover:cursor-pointer"
          >
            <QuizIcon />
            {COPY_MCQ_QUIZ_LABELS[copyMcqQuizStatus]}
          </button>

          <button
            onClick={handleCopyOpenQuizPrompt}
            title="Copier un prompt pour qu'une IA me pose 30 questions ouvertes sur cette fiche, sans choix de réponses"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors hover:cursor-pointer"
          >
            <QuizIcon />
            {COPY_OPEN_QUIZ_LABELS[copyOpenQuizStatus]}
          </button>

          <button
            onClick={() => setReplaceOpen(true)}
            disabled={currentEditing !== null}
            title={currentEditing !== null ? "Terminez l'édition de la section en cours" : undefined}
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UploadIcon color="currentColor" />
            Remplacer
          </button>

          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors hover:cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            PDF
          </button>

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
      </div>

      <div className={hasToc ? 'xl:grid xl:grid-cols-[minmax(0,1fr)_14rem] xl:gap-10 print:block' : undefined}>
        <div className="min-w-0">
          <header className="mb-8 max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
              Fiche de révision
            </p>
            <h1 className="font-display text-3xl font-bold text-stone-900 leading-snug mb-3">
              {card.title}
            </h1>
            <p className="text-xs text-stone-400">{formatFlashCardMeta(card)}</p>
            {card.summary && (
              <div className="mt-4 pl-4" style={{ borderLeft: '2px solid rgba(196,116,42,0.4)' }}>
                <p className="text-sm text-stone-600 leading-relaxed italic">{card.summary}</p>
              </div>
            )}
          </header>

          <hr className="border-stone-200/70 mb-8 max-w-4xl" />

          <div className="rounded-none lg:rounded-2xl p-0 lg:p-8 max-w-4xl overflow-hidden -mx-4 lg:mx-0 bg-card print:bg-transparent print:p-0 print:mx-0 print:max-w-none print:overflow-visible">
            <div ref={contentRef}>
              <MarkdownRenderer
                content={card.content}
                sectionEditing={{
                  sections,
                  editingIndex: currentEditing?.index ?? null,
                  onEdit: handleEditSection,
                  editor: currentEditing ? (
                    <SectionEditor
                      regionLabel={editorRegionLabel(sections[currentEditing.index])}
                      initialText={getEditableText(sections[currentEditing.index])}
                      saving={updateMutation.isPending}
                      error={saveError}
                      onDirtyChange={setDirty}
                      onCancel={handleCancel}
                      onSave={handleSave}
                    />
                  ) : null,
                }}
              />
            </div>
          </div>
        </div>

        {hasToc && (
          <aside className="hidden xl:block print:hidden self-start sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Sommaire</p>
              <button
                onClick={() => setTocCollapsed((collapsed) => !collapsed)}
                aria-expanded={!tocCollapsed}
                aria-controls="toc-panel"
                aria-label={tocCollapsed ? 'Déplier le sommaire' : 'Replier le sommaire'}
                className="text-stone-400 hover:text-stone-700 transition-colors hover:cursor-pointer"
              >
                <ChevronIcon className={`transition-transform ${tocCollapsed ? '-rotate-90' : ''}`} />
              </button>
            </div>
            <div id="toc-panel" hidden={tocCollapsed}>
              <TableOfContents items={items} activeId={activeId} onNavigate={navigateTo} />
            </div>
          </aside>
        )}
      </div>

      {hasToc && (
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Ouvrir le sommaire"
          aria-expanded={drawerOpen}
          aria-controls="toc-drawer"
          className="fixed bottom-4 right-4 z-30 xl:hidden print:hidden rounded-full p-3 shadow-lg bg-brand text-on-brand hover:bg-brand-hover transition-colors hover:cursor-pointer"
        >
          <ListIcon />
        </button>
      )}

      {hasToc && drawerOpen && (
        <>
          <div
            className="xl:hidden print:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            id="toc-drawer"
            role="dialog"
            aria-label="Sommaire"
            className="xl:hidden print:hidden fixed inset-y-0 right-0 z-50 w-72 bg-surface p-5 overflow-y-auto shadow-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Sommaire</p>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Fermer le sommaire"
                className="text-stone-400 hover:text-stone-700 transition-colors hover:cursor-pointer"
              >
                <CloseIcon />
              </button>
            </div>
            <TableOfContents items={items} activeId={activeId} onNavigate={navigateFromDrawer} />
          </div>
        </>
      )}

      <ReplaceModal open={replaceOpen} onClose={() => setReplaceOpen(false)} card={card} />
    </div>
  )
}
