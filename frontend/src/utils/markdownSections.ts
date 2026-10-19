/**
 * Découpage d'une fiche Markdown en sections éditables.
 *
 * Un titre de section est une ligne qui commence en colonne 0 par `##` suivi d'un espace, d'une tabulation
 * ou de la fin de ligne (`###`, `##Titre` et les titres indentés ne comptent pas). Les lignes situées dans un
 * bloc de code délimité par ``` ou ~~~ sont ignorées ; un bloc se ferme par le même caractère répété au moins
 * autant de fois, et un bloc non fermé court jusqu'à la fin du contenu.
 *
 * Invariant : `splitSections(content).map((s) => s.raw).join('') === content`.
 */
export type MarkdownSectionKind = 'intro' | 'heading'

export interface MarkdownSection {
  index: number
  kind: MarkdownSectionKind
  raw: string
  startLine: number
  headingText: string | null
}

interface Line {
  text: string
  start: number
  lineNo: number
}

interface Fence {
  char: string
  len: number
}

const FENCE_CLOSE = /^ {0,3}(`+|~+)[ \t]*$/
const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})(.*)$/
const HEADING = /^##(?:[ \t]|$)/
const CLOSING_SEQUENCE = /(?:^|[ \t]+)#+[ \t]*$/
const TRAILING_BLANK_LINES = /(?:\r\n|\r|\n)(?:[ \t]*(?:\r\n|\r|\n))*[ \t]*$/
const FIRST_EOL = /\r\n|\r|\n/

function splitLines(content: string): Line[] {
  const lines: Line[] = []
  let pos = 0
  let lineNo = 1
  while (pos < content.length) {
    let end = pos
    while (end < content.length && content[end] !== '\n' && content[end] !== '\r') end++
    lines.push({ text: content.slice(pos, end), start: pos, lineNo })
    if (end >= content.length) break
    pos = content[end] === '\r' && content[end + 1] === '\n' ? end + 2 : end + 1
    lineNo++
  }
  return lines
}

function closesFence(text: string, fence: Fence): boolean {
  const match = FENCE_CLOSE.exec(text)
  if (!match) return false
  const marker = match[1]
  return marker[0] === fence.char && marker.length >= fence.len
}

function opensFence(text: string): Fence | null {
  const match = FENCE_OPEN.exec(text)
  if (!match) return null
  const marker = match[1]
  if (marker[0] === '`' && match[2].includes('`')) return null
  return { char: marker[0], len: marker.length }
}

function extractHeadingText(text: string): string {
  return text.slice(2).replace(CLOSING_SEQUENCE, '').trim()
}

/**
 * Découpe `content` en sections. Le texte qui précède le premier titre forme une section `intro` (même blanche) ;
 * sans titre, tout le contenu est une intro ; un contenu vide renvoie `[]`. Chaque `raw` inclut ses fins de ligne
 * finales, et `startLine` (base 1) compte `\r\n`, `\r` et `\n` comme une seule fin de ligne, comme micromark.
 */
export function splitSections(content: string): MarkdownSection[] {
  if (content === '') return []

  const headings: { start: number; lineNo: number; text: string }[] = []
  let fence: Fence | null = null
  for (const line of splitLines(content)) {
    if (fence) {
      if (closesFence(line.text, fence)) fence = null
      continue
    }
    const opened = opensFence(line.text)
    if (opened) {
      fence = opened
      continue
    }
    if (HEADING.test(line.text)) {
      headings.push({ start: line.start, lineNo: line.lineNo, text: extractHeadingText(line.text) })
    }
  }

  const sections: MarkdownSection[] = []
  const firstStart = headings.length > 0 ? headings[0].start : content.length
  if (firstStart > 0) {
    sections.push({ index: 0, kind: 'intro', raw: content.slice(0, firstStart), startLine: 1, headingText: null })
  }
  headings.forEach((heading, i) => {
    const end = i + 1 < headings.length ? headings[i + 1].start : content.length
    sections.push({
      index: sections.length,
      kind: 'heading',
      raw: content.slice(heading.start, end),
      startLine: heading.lineNo,
      headingText: heading.text,
    })
  })
  return sections
}

/** Une section titrée est toujours éditable ; une intro seulement si elle n'est pas blanche. */
export function isEditableSection(section: MarkdownSection): boolean {
  return section.kind === 'heading' || section.raw.trim() !== ''
}

function assertIndex(sections: MarkdownSection[], index: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= sections.length) {
    throw new RangeError(`Section index out of range: ${index}`)
  }
}

/**
 * Remplace le `raw` de la section `index` par `newText`, les autres sections restant intactes à l'octet près.
 * @throws {RangeError} si `index` n'est pas un entier dans les bornes.
 */
export function replaceSection(content: string, index: number, newText: string): string {
  const sections = splitSections(content)
  assertIndex(sections, index)
  const prefix = sections.slice(0, index).map((s) => s.raw).join('')
  const suffix = sections.slice(index + 1).map((s) => s.raw).join('')
  return prefix + newText + suffix
}

/**
 * Sépare les lignes vides finales (`suffix`, qui commence toujours à une fin de ligne) du reste (`body`).
 * Les espaces finaux d'une ligne de contenu (saut de ligne dur) restent dans `body`.
 */
export function splitTrailingBlankLines(text: string): { body: string; suffix: string } {
  const match = TRAILING_BLANK_LINES.exec(text)
  if (!match) return { body: text, suffix: '' }
  return { body: text.slice(0, match.index), suffix: match[0] }
}

function normalizeEol(text: string): string {
  return text.replace(/\r\n?/g, '\n')
}

/** Texte proposé à l'édition : `raw` sans ses lignes vides finales, fins de ligne normalisées en `\n`. */
export function getEditableText(section: MarkdownSection): string {
  return normalizeEol(splitTrailingBlankLines(section.raw).body)
}

/**
 * Reconstruit le contenu complet après édition de la section `index` (décision Q2).
 * Les lignes vides finales du brouillon sont retirées, puis le suffixe de lignes vides d'origine de la section est
 * restauré exactement, ce qui garde le `##` suivant en début de ligne. Les `\n` du brouillon sont reconvertis dans la
 * fin de ligne de la section (à défaut celle du contenu, à défaut `\n`). Un brouillon inchangé redonne `content`.
 *
 * Le brouillon est libre : modifier ou supprimer la ligne `## Titre`, ou ajouter un `##`, produit un contenu valide
 * dont le découpage change (sections fusionnées ou ajoutées) ; il est recalculé depuis la réponse du serveur.
 * @throws {RangeError} si `index` est hors bornes.
 */
export function applySectionEdit(content: string, index: number, draft: string): string {
  const sections = splitSections(content)
  assertIndex(sections, index)
  const raw = sections[index].raw
  const { suffix } = splitTrailingBlankLines(raw)
  const eol = FIRST_EOL.exec(raw)?.[0] ?? FIRST_EOL.exec(content)?.[0] ?? '\n'
  const body = splitTrailingBlankLines(normalizeEol(draft)).body.replace(/\n/g, eol)
  return replaceSection(content, index, body + suffix)
}
