import { createContext, useContext } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import type { Components, ExtraProps, Options } from 'react-markdown'
import MermaidDiagram from './MermaidDiagram'
import { PencilIcon } from './icons/icons'
import rehypeSections from '../utils/rehypeSections'
import type { MarkdownSection } from '../utils/markdownSections'

export interface SectionEditingOptions {
  sections: MarkdownSection[]
  editingIndex: number | null
  onEdit: (index: number) => void
  editor: ReactNode
}

interface MarkdownRendererProps {
  content: string
  sectionEditing?: SectionEditingOptions
  headingIds?: boolean
}

const SectionEditingContext = createContext<SectionEditingOptions | null>(null)

const components: Components = {
  code({ className, children }) {
    const lang = /language-(\w+)/.exec(className ?? '')?.[1]
    if (lang === 'mermaid') {
      return <MermaidDiagram chart={String(children).trim()} />
    }
    return <code className={className}>{children}</code>
  },
  table({ children }) {
    return (
      <div className="-mx-4 lg:mx-0 overflow-x-auto">
        <div className="px-4 lg:px-0 inline-block min-w-full">
          <table>{children}</table>
        </div>
      </div>
    )
  },
}

function sectionLabel(section: MarkdownSection): string {
  if (section.kind === 'intro') return "Modifier l'introduction"
  return `Modifier la section « ${section.headingText || 'sans titre'} »`
}

function SectionDiv({ node, children, ...rest }: ComponentPropsWithoutRef<'div'> & ExtraProps) {
  const ctx = useContext(SectionEditingContext)
  const rawIndex = node?.properties?.dataSectionIndex
  if (!ctx || typeof rawIndex !== 'string') {
    return <div {...rest}>{children}</div>
  }

  const index = Number(rawIndex)
  const section = ctx.sections[index]
  const editing = ctx.editingIndex === index

  return (
    <>
      {editing && ctx.editor}
      <div
        {...rest}
        className={`group relative min-h-6 scroll-mt-20 lg:scroll-mt-8 [&>:first-child]:pr-8 first:[&>:first-child]:mt-0 last:[&>:last-child]:mb-0${editing ? ' hidden print:block' : ''}`}
      >
        {children}
        {!editing && section && (
          <button
            type="button"
            data-section-edit
            aria-label={sectionLabel(section)}
            onClick={() => ctx.onEdit(index)}
            className="absolute right-0 top-1 p-1 rounded text-stone-400 hover:text-stone-700 transition-opacity [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-visible:opacity-100 print:hidden hover:cursor-pointer"
          >
            <PencilIcon />
          </button>
        )}
      </div>
    </>
  )
}

const sectionComponents: Components = { ...components, div: SectionDiv }

export default function MarkdownRenderer({ content, sectionEditing, headingIds = true }: MarkdownRendererProps) {
  // rehype-slug après rehype-sanitize : sanitize préfixe les id en « user-content- » (anti DOM clobbering),
  // placé avant il casserait les liens du sommaire ; ici les id sont dérivés du texte des titres, risque faible
  const rehypePlugins: NonNullable<Options['rehypePlugins']> = headingIds ? [rehypeSanitize, rehypeSlug] : [rehypeSanitize]
  const sectionsMatch = sectionEditing !== undefined && sectionEditing.sections.map((s) => s.raw).join('') === content
  if (sectionEditing && sectionsMatch) {
    rehypePlugins.push([rehypeSections, { sections: sectionEditing.sections }])
  }

  return (
    <div className="prose prose-stone max-w-none px-4 py-4 lg:px-0 lg:py-0 print:p-0 prose-headings:scroll-mt-20 lg:prose-headings:scroll-mt-8">
      <SectionEditingContext.Provider value={sectionEditing ?? null}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={rehypePlugins}
          components={sectionEditing ? sectionComponents : components}
        >
          {content}
        </ReactMarkdown>
      </SectionEditingContext.Provider>
    </div>
  )
}
