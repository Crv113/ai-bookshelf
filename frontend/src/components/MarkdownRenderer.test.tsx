import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MarkdownRenderer from './MarkdownRenderer'
import type { SectionEditingOptions } from './MarkdownRenderer'
import { splitSections } from '../utils/markdownSections'

vi.mock('./MermaidDiagram', () => ({ default: () => null }))

describe('MarkdownRenderer', () => {
  it('adds slug ids to headings without the sanitize prefix', () => {
    const { container } = render(<MarkdownRenderer content={'## Introduction\n\n### Détails'} />)

    expect(container.querySelector('h2')).toHaveAttribute('id', 'introduction')
    expect(container.querySelector('h3')).toHaveAttribute('id', 'détails')
    expect(container.querySelector('[id^="user-content-"]')).toBeNull()
  })

  it('deduplicates identical heading slugs', () => {
    const { container } = render(<MarkdownRenderer content={'## X\n\ntexte\n\n## X'} />)

    const ids = Array.from(container.querySelectorAll('h2')).map((h) => h.id)
    expect(ids).toEqual(['x', 'x-1'])
  })

  it('keeps the prefixed footnote heading inside the footnotes section', () => {
    const { container } = render(<MarkdownRenderer content={'Texte[^1]\n\n[^1]: Une note'} />)

    const footnoteHeading = container.querySelector('h2#user-content-footnote-label')
    expect(footnoteHeading).not.toBeNull()
    expect(footnoteHeading?.closest('section[data-footnotes]')).not.toBeNull()
  })
})

function opts(content: string, extra: Partial<SectionEditingOptions> = {}): SectionEditingOptions {
  return { sections: splitSections(content), editingIndex: null, onEdit: vi.fn(), editor: null, ...extra }
}

describe('MarkdownRenderer section editing', () => {
  it('renders no wrapper nor button without section editing', () => {
    const { container } = render(<MarkdownRenderer content={'Intro\n\n## A\n\nx'} />)

    expect(container.querySelector('[data-section-index]')).toBeNull()
    expect(container.querySelector('button')).toBeNull()
  })

  it('wraps each section with an edit button', () => {
    const content = 'Intro\n\n## A\n\nx\n\n## B'
    const options = opts(content)
    const { container } = render(<MarkdownRenderer content={content} sectionEditing={options} />)

    expect(container.querySelectorAll('[data-section-index]')).toHaveLength(3)
    expect(screen.getByRole('button', { name: "Modifier l'introduction" })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Modifier la section « A »' })).toBeInTheDocument()
    const pencilB = screen.getByRole('button', { name: 'Modifier la section « B »' })
    expect(pencilB).toHaveClass('print:hidden')

    const h2 = container.querySelector('h2')
    expect(h2?.textContent).toBe('A')
    expect(h2?.id).toBe('a')
    expect(h2?.parentElement?.firstElementChild).toBe(h2)
    expect(h2?.parentElement).toHaveAttribute('data-section-index', '1')

    fireEvent.click(pencilB)
    expect(options.onEdit).toHaveBeenCalledWith(2)
  })

  it('renders no intro button for a blank intro', () => {
    const content = '\n\n## A'
    render(<MarkdownRenderer content={content} sectionEditing={opts(content)} />)

    expect(screen.queryByRole('button', { name: "Modifier l'introduction" })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Modifier la section « A »' })).toBeInTheDocument()
  })

  it.each([
    'T\n---\n\n## A',
    '<div>\n## X\n</div>\n\n## A',
  ])('renders no wrapper when the split is inconsistent with the rendering %#', (content) => {
    const { container } = render(<MarkdownRenderer content={content} sectionEditing={opts(content)} />)

    expect(container.querySelector('[data-section-index]')).toBeNull()
    expect(container.querySelector('button')).toBeNull()
    expect(container.querySelector('h2[id]')).not.toBeNull()
  })

  it('hides the edited section and renders the editor before it', () => {
    const content = 'Intro\n\n## A\n\nx'
    const { container } = render(
      <MarkdownRenderer content={content} sectionEditing={opts(content, { editingIndex: 1, editor: <p>EDITEUR</p> })} />,
    )

    const wrapper = container.querySelector('[data-section-index="1"]')
    expect(wrapper).toHaveClass('hidden', 'print:block')
    expect(wrapper?.querySelector('[data-section-edit]')).toBeNull()
    expect(wrapper?.previousElementSibling?.textContent).toBe('EDITEUR')
  })

  it('keeps the footnotes outside the wrappers', () => {
    const content = '## A\n\nTexte[^1]\n\n[^1]: Une note'
    const { container } = render(<MarkdownRenderer content={content} sectionEditing={opts(content)} />)

    const footnotes = container.querySelector('section[data-footnotes]')
    expect(footnotes).not.toBeNull()
    expect(footnotes?.closest('[data-section-index]')).toBeNull()
    expect(footnotes?.querySelector('button')).toBeNull()
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('renders headings without ids when headingIds is false', () => {
    const { container } = render(<MarkdownRenderer content={'## A'} headingIds={false} />)

    expect(container.querySelector('h2')).not.toHaveAttribute('id')
  })

  it('renders no wrapper when the sections come from another content', () => {
    const { container } = render(<MarkdownRenderer content={'## A\n\n## B'} sectionEditing={opts('## C')} />)

    expect(container.querySelector('[data-section-index]')).toBeNull()
  })
})
