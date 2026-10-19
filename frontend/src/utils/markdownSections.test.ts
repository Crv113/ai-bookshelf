import { describe, it, expect } from 'vitest'
import {
  applySectionEdit,
  getEditableText,
  isEditableSection,
  replaceSection,
  splitSections,
  splitTrailingBlankLines,
} from './markdownSections'

const BASE = 'Intro\n\n## A\n\ntexte\n## B\nfin'

function joined(content: string): string {
  return splitSections(content).map((s) => s.raw).join('')
}

describe('splitSections', () => {
  it('returns a single intro when there is no h2', () => {
    const content = 'Texte\n\n### Sous-titre'
    const sections = splitSections(content)

    expect(sections).toHaveLength(1)
    expect(sections[0]).toEqual({ index: 0, kind: 'intro', raw: content, startLine: 1, headingText: null })
  })

  it('splits an intro and h2 sections', () => {
    const sections = splitSections(BASE)

    expect(sections.map((s) => s.raw)).toEqual(['Intro\n\n', '## A\n\ntexte\n', '## B\nfin'])
    expect(sections.map((s) => s.startLine)).toEqual([1, 3, 6])
    expect(sections.map((s) => s.kind)).toEqual(['intro', 'heading', 'heading'])
    expect(sections.map((s) => s.headingText)).toEqual([null, 'A', 'B'])
    expect(sections.map((s) => s.index)).toEqual([0, 1, 2])
  })

  it('has no intro when the content starts with a heading', () => {
    const content = '## A\nx'
    const sections = splitSections(content)

    expect(sections).toHaveLength(1)
    expect(sections[0].kind).toBe('heading')
    expect(joined(content)).toBe(content)
  })

  it.each([
    '```\n## X\n```',
    '~~~\n## X\n~~~',
    '```mermaid\n## X\n```',
  ])('ignores headings inside fenced code %#', (content) => {
    expect(splitSections(content).filter((s) => s.kind === 'heading')).toHaveLength(0)
  })

  it('only closes a fence with the same char and enough length', () => {
    const sections = splitSections('````\n```\n## X\n````\n## Y')

    expect(sections.filter((s) => s.kind === 'heading').map((s) => s.headingText)).toEqual(['Y'])
    expect(splitSections('~~~\n```\n## X').filter((s) => s.kind === 'heading')).toHaveLength(0)
  })

  it('treats an unclosed fence as running to the end', () => {
    expect(splitSections('texte\n```\n## X').filter((s) => s.kind === 'heading')).toHaveLength(0)
  })

  it('does not treat backtick info strings containing a backtick as a fence', () => {
    const sections = splitSections('``` a`b\n## X')

    expect(sections.filter((s) => s.kind === 'heading').map((s) => s.headingText)).toEqual(['X'])
  })

  it.each([
    '### Titre',
    '#### Titre',
    '##Titre',
    ' ## Titre',
    '\t## Titre',
    '    ## Titre',
  ])('does not treat %j as a section heading', (line) => {
    expect(splitSections(`Intro\n${line}\ntexte`)).toHaveLength(1)
  })

  it('handles empty headings, tabs and closing sequences', () => {
    const sections = splitSections('##\n## \tA\n## B ##')

    expect(sections.map((s) => s.headingText)).toEqual(['', 'A', 'B'])
  })

  it('counts CRLF and CR as a single line ending', () => {
    const crlf = 'Intro\r\n\r\n## A\r\ntexte\r\n## B\r\nfin'
    const crlfSections = splitSections(crlf)
    expect(crlfSections.map((s) => s.startLine)).toEqual([1, 3, 5])
    expect(crlfSections.map((s) => s.raw)).toEqual(['Intro\r\n\r\n', '## A\r\ntexte\r\n', '## B\r\nfin'])
    expect(joined(crlf)).toBe(crlf)

    const cr = 'Intro\r\r## A\rtexte\r## B\rfin'
    const crSections = splitSections(cr)
    expect(crSections.map((s) => s.startLine)).toEqual([1, 3, 5])
    expect(crSections.map((s) => s.raw)).toEqual(['Intro\r\r', '## A\rtexte\r', '## B\rfin'])
    expect(joined(cr)).toBe(cr)
  })

  it('handles headings without content', () => {
    expect(splitSections('## A\n## B').map((s) => s.raw)).toEqual(['## A\n', '## B'])
    expect(splitSections('## A\n## B\n').map((s) => s.raw)).toEqual(['## A\n', '## B\n'])
  })

  it('keeps the join invariant', () => {
    expect(splitSections('')).toEqual([])

    const blank = splitSections('\n\n\n')
    expect(blank).toHaveLength(1)
    expect(blank[0].kind).toBe('intro')
    expect(isEditableSection(blank[0])).toBe(false)

    for (const content of [
      '## Été 🚀\n\n## 中文',
      '~~~\n## X\n~~~\n## A\n```\n## Y\n```\n## B',
      BASE,
    ]) {
      expect(joined(content)).toBe(content)
    }
  })
})

describe('isEditableSection', () => {
  it('rejects blank intros and accepts others', () => {
    expect(isEditableSection(splitSections('\n\n## A')[0])).toBe(false)
    expect(isEditableSection(splitSections('Intro\n## A')[0])).toBe(true)
    expect(isEditableSection(splitSections('## A')[0])).toBe(true)
  })
})

describe('replaceSection', () => {
  it('is the identity when replacing with the same raw text', () => {
    splitSections(BASE).forEach((section, i) => {
      expect(replaceSection(BASE, i, section.raw)).toBe(BASE)
    })
  })

  it('keeps the other sections intact', () => {
    expect(replaceSection(BASE, 1, '## A\nnew\n')).toBe('Intro\n\n## A\nnew\n## B\nfin')
  })

  it('can add or remove sections', () => {
    expect(splitSections(replaceSection(BASE, 1, '## A\nx\n## A2\ny\n'))).toHaveLength(4)
    expect(splitSections(replaceSection(BASE, 1, 'x\n'))).toHaveLength(2)
  })

  it('throws on out of range indexes', () => {
    expect(() => replaceSection(BASE, -1, 'x')).toThrow(RangeError)
    expect(() => replaceSection(BASE, 3, 'x')).toThrow(RangeError)
    expect(() => replaceSection(BASE, 1.5, 'x')).toThrow(RangeError)
  })
})

describe('splitTrailingBlankLines', () => {
  it('splits trailing blank lines but keeps trailing spaces of content lines', () => {
    expect(splitTrailingBlankLines('a\n\n  \n')).toEqual({ body: 'a', suffix: '\n\n  \n' })
    expect(splitTrailingBlankLines('texte  \n')).toEqual({ body: 'texte  ', suffix: '\n' })
    expect(splitTrailingBlankLines('a')).toEqual({ body: 'a', suffix: '' })
  })
})

describe('getEditableText', () => {
  it('strips trailing blank lines and normalizes line endings', () => {
    expect(getEditableText(splitSections('## A\n\ntexte\n\n\n')[0])).toBe('## A\n\ntexte')
    expect(getEditableText(splitSections('## A\r\n\r\nx\r\n')[0])).toBe('## A\n\nx')
    expect(getEditableText(splitSections('texte  \n')[0])).toBe('texte  ')
  })
})

describe('applySectionEdit', () => {
  it('keeps the next heading on its own line', () => {
    const result = applySectionEdit(BASE, 1, '## A\nsans fin')

    expect(result).toContain('sans fin\n## B')
    expect(splitSections(result)).toHaveLength(3)
  })

  it('throws on out of range indexes', () => {
    expect(() => applySectionEdit(BASE, 99, 'x')).toThrow(RangeError)
  })

  it('rewrites the edited section with the original line endings', () => {
    const content = 'Intro\r\n\r\n## A\r\n\r\nTexte A\r\n\r\n## B\r\n\r\nTexte B\r\n'
    const result = applySectionEdit(content, 1, '## A\n\nNouveau')

    expect(result).toBe('Intro\r\n\r\n## A\r\n\r\nNouveau\r\n\r\n## B\r\n\r\nTexte B\r\n')
  })

  it.each([
    'Intro\n\n## A\n\nTexte A\n\n## B\n\nTexte B\n',
    'Intro\r\n\r\n## A\r\n\r\nTexte A\r\n\r\n## B\r\n\r\nTexte B\r\n',
    BASE,
  ])('is the identity with the unmodified editable text %#', (content) => {
    splitSections(content).forEach((section, i) => {
      expect(applySectionEdit(content, i, getEditableText(section))).toBe(content)
    })
  })

  it('restores the original suffix whatever the draft trailing lines', () => {
    const content = 'Intro\n\n## A\n\nTexte A\n\n## B'

    expect(applySectionEdit(content, 1, '## A\n\nTexte A\n\n\n')).toBe(content)
    expect(applySectionEdit(content, 1, '## A\n\nTexte A\n  \n')).toBe(content)
  })

  it('removes a section when the draft is empty', () => {
    expect(applySectionEdit(BASE, 2, '')).toBe('Intro\n\n## A\n\ntexte\n')
    expect(applySectionEdit(BASE, 1, '')).toBe('Intro\n\n\n## B\nfin')
  })
})
