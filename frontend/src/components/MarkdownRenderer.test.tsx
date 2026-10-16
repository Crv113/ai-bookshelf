import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import MarkdownRenderer from './MarkdownRenderer'

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
