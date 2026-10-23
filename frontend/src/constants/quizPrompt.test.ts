import { describe, it, expect } from 'vitest'
import { buildQuizPrompt } from './quizPrompt'
import type { QuizMode } from './quizPrompt'

const MODES: QuizMode[] = ['mcq', 'open']

describe('buildQuizPrompt', () => {
  it.each(MODES)('embeds the title and the full markdown content of the card (%s)', (mode) => {
    const content = '## Propagation\n\n```java\n@Transactional\n```\n\nREQUIRED rejoint la transaction.'

    const prompt = buildQuizPrompt({ title: 'Transactions JPA', content }, mode)

    expect(prompt).toContain('« Transactions JPA »')
    expect(prompt).toContain(`<fiche>\n${content}\n</fiche>`)
  })

  it.each(MODES)('asks for 30 questions, one at a time, after the card content (%s)', (mode) => {
    const prompt = buildQuizPrompt({ title: 'T', content: 'Contenu' }, mode)

    expect(prompt).toContain('30 questions')
    expect(prompt).toContain('score sur 30')
    expect(prompt.indexOf('</fiche>')).toBeLessThan(prompt.indexOf('une seule question'))
    expect(prompt.trimEnd().endsWith('Commence directement par la question 1.')).toBe(true)
  })

  it('asks for four clickable choices in an interactive interface in MCQ mode', () => {
    const prompt = buildQuizPrompt({ title: 'T', content: 'Contenu' }, 'mcq')

    expect(prompt).toContain('4 choix notés A, B, C et D')
    expect(prompt).toContain('interface interactive')
    expect(prompt).toContain('boutons cliquables')
  })

  it('forbids answer choices in open mode', () => {
    const prompt = buildQuizPrompt({ title: 'T', content: 'Contenu' }, 'open')

    expect(prompt).toContain('ne propose jamais de choix de réponses')
    expect(prompt).not.toContain('A, B, C et D')
  })
})
