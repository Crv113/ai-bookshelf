import type { Element, Root, RootContent } from 'hast'
import { isEditableSection } from './markdownSections'
import type { MarkdownSection } from './markdownSections'

export interface RehypeSectionsOptions {
  sections: MarkdownSection[]
}

function isRootH2(node: RootContent): node is Element {
  return node.type === 'element' && node.tagName === 'h2'
}

function wrap(index: number): Element {
  return { type: 'element', tagName: 'div', properties: { dataSectionIndex: String(index) }, children: [] }
}

/**
 * Plugin rehype, à placer après rehype-slug, qui regroupe les enfants racine du hast en `div[data-section-index]`
 * selon `sections`. Si les h2 racine ne correspondent pas exactement aux sections titrées (nombre ou ligne de
 * départ, par ex. titre setext ou `##` dans du HTML), l'arbre est laissé intact. Les éléments sans position
 * (section des notes de bas de page) restent à la racine et ferment la section courante.
 */
export default function rehypeSections({ sections }: RehypeSectionsOptions): (tree: Root) => void {
  return (tree) => {
    const headingSections = sections.filter((s) => s.kind === 'heading')
    const rootH2 = tree.children.filter(isRootH2)
    if (rootH2.length !== headingSections.length) return
    const consistent = rootH2.every((h2, i) => h2.position?.start.line === headingSections[i].startLine)
    if (!consistent) return

    const output: RootContent[] = []
    let current: Element | null = null
    if (sections.length > 0 && sections[0].kind === 'intro' && isEditableSection(sections[0])) {
      current = wrap(0)
      output.push(current)
    }

    let headingCount = 0
    for (const child of tree.children) {
      if (child.type === 'element' && child.tagName === 'h2') {
        current = wrap(headingSections[headingCount].index)
        headingCount++
        output.push(current)
        current.children.push(child)
      } else if (child.type === 'element' && !child.position) {
        current = null
        output.push(child)
      } else if (child.type === 'doctype') {
        output.push(child)
      } else if (current) {
        current.children.push(child)
      } else {
        output.push(child)
      }
    }
    tree.children = output
  }
}
