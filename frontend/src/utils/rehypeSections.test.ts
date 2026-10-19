import { describe, it, expect } from 'vitest'
import type { Element, ElementContent, Root, RootContent } from 'hast'
import rehypeSections from './rehypeSections'
import { splitSections } from './markdownSections'

function el(tagName: string, line: number | null, children: ElementContent[] = []): Element {
  const node: Element = { type: 'element', tagName, properties: {}, children }
  if (line !== null) {
    node.position = { start: { line, column: 1 }, end: { line, column: 2 } }
  }
  return node
}

function text(value: string): ElementContent {
  return { type: 'text', value }
}

function root(children: RootContent[]): Root {
  return { type: 'root', children }
}

function run(content: string, tree: Root): Root {
  rehypeSections({ sections: splitSections(content) })(tree)
  return tree
}

function sectionIndex(node: RootContent): string | undefined {
  if (node.type !== 'element') return undefined
  const value = node.properties.dataSectionIndex
  return typeof value === 'string' ? value : undefined
}

describe('rehypeSections', () => {
  it('wraps an editable intro and each root h2 with its section index', () => {
    const intro = el('p', 1, [text('Intro')])
    const h2a = el('h2', 3, [text('A')])
    const pa = el('p', 5)
    const h2b = el('h2', 7, [text('B')])
    const tree = run('Intro\n\n## A\n\nx\n\n## B', root([intro, text('\n'), h2a, text('\n'), pa, text('\n'), h2b]))

    expect(tree.children.map(sectionIndex)).toEqual(['0', '1', '2'])
    const [w0, w1, w2] = tree.children
    expect(w0.type === 'element' && w0.tagName).toBe('div')
    expect(w0.type === 'element' && w0.children[0]).toBe(intro)
    expect(w1.type === 'element' && w1.children).toEqual([h2a, text('\n'), pa, text('\n')])
    expect(w2.type === 'element' && w2.children).toEqual([h2b])
  })

  it('leaves a blank intro unwrapped', () => {
    const h2 = el('h2', 3, [text('A')])
    const tree = run('\n\n## A', root([text('\n'), h2]))

    expect(tree.children[0]).toEqual(text('\n'))
    expect(tree.children.map(sectionIndex)).toEqual([undefined, '1'])
  })

  it('wraps an intro without h2', () => {
    const p = el('p', 1)
    const tree = run('Texte', root([p]))

    expect(tree.children.map(sectionIndex)).toEqual(['0'])
  })

  it('leaves the tree unchanged when the h2 count differs', () => {
    const children: RootContent[] = [el('h2', 1), el('h2', 4)]
    const tree = run('T\n---\n\n## A', root([...children]))

    expect(tree.children).toEqual(children)
  })

  it('leaves the tree unchanged when an h2 line differs', () => {
    const children: RootContent[] = [el('p', 1), el('h2', 2)]
    const tree = run('Intro\n\n## A', root([...children]))

    expect(tree.children).toEqual(children)
  })

  it('ignores h2 nested in blockquotes and list items', () => {
    const quote = el('blockquote', 3, [el('h2', 3)])
    const list = el('ul', 5, [el('li', 5, [el('h2', 5)])])
    const tree = run('## A\n\n> ## Q\n\n- ## I\n\n## B', root([el('h2', 1), quote, list, el('h2', 7)]))

    expect(tree.children.map(sectionIndex)).toEqual(['0', '1'])
    const first = tree.children[0]
    expect(first.type === 'element' && first.children).toContain(quote)
    expect(first.type === 'element' && first.children).toContain(list)
  })

  it('keeps elements without position at the root and closes the current section', () => {
    const footnotes = el('section', null, [el('h2', null)])
    const trailing = text('\n')
    const tree = run('## A\n\nTexte', root([el('h2', 1), el('p', 3), footnotes, trailing]))

    expect(tree.children.map(sectionIndex)).toEqual(['0', undefined, undefined])
    expect(tree.children[1]).toBe(footnotes)
    expect(tree.children[2]).toBe(trailing)
  })
})
