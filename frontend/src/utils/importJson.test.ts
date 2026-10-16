import { describe, it, expect } from 'vitest'
import { parseImportJson, toImportJson, INVALID_JSON_ERROR, MISSING_FIELDS_ERROR } from './importJson'

const valid = {
  title: 'Titre',
  summary: 'Résumé',
  model: 'Claude Opus 5.5',
  content: '## Section\n\nTexte',
  estimated_time: '12',
}

describe('parseImportJson', () => {
  it('accepts a valid JSON with estimated_time as a string', () => {
    expect(parseImportJson(JSON.stringify(valid))).toEqual({
      ok: true,
      data: { title: 'Titre', summary: 'Résumé', content: '## Section\n\nTexte', model: 'Claude Opus 5.5', estimatedTime: 12 },
    })
  })

  it('accepts a valid JSON with estimated_time as a number', () => {
    const result = parseImportJson(JSON.stringify({ ...valid, estimated_time: 12 }))
    expect(result).toEqual({ ok: true, data: expect.objectContaining({ estimatedTime: 12 }) })
  })

  it('rejects a malformed JSON', () => {
    expect(parseImportJson('{ "title": ')).toEqual({ ok: false, error: INVALID_JSON_ERROR })
  })

  it.each(['title', 'summary', 'content', 'model', 'estimated_time'])('rejects a JSON with %s missing', (field) => {
    const data: Record<string, unknown> = { ...valid }
    delete data[field]
    expect(parseImportJson(JSON.stringify(data))).toEqual({ ok: false, error: MISSING_FIELDS_ERROR })
  })

  it.each(['title', 'summary', 'content', 'model', 'estimated_time'])('rejects a JSON with %s empty', (field) => {
    expect(parseImportJson(JSON.stringify({ ...valid, [field]: '' }))).toEqual({ ok: false, error: MISSING_FIELDS_ERROR })
  })

  it.each(['abc', 0, -3])('rejects estimated_time %s', (value) => {
    expect(parseImportJson(JSON.stringify({ ...valid, estimated_time: value }))).toEqual({ ok: false, error: MISSING_FIELDS_ERROR })
  })

  it.each(['null', '[]', '"texte"'])('rejects the non-object JSON %s without throwing', (raw) => {
    expect(parseImportJson(raw)).toEqual({ ok: false, error: MISSING_FIELDS_ERROR })
  })

  it('uses the exact error messages', () => {
    expect(INVALID_JSON_ERROR).toBe('JSON invalide. Vérifiez la syntaxe.')
    expect(MISSING_FIELDS_ERROR).toBe('Le JSON doit contenir title, summary, content, model et estimated_time.')
  })
})

describe('toImportJson', () => {
  const card = { title: 'Titre', summary: 'Résumé', model: 'Claude Opus 5.5', content: '## A\n\n"quote"', estimatedTime: 12 }

  it('serializes the card in the import prompt format', () => {
    expect(toImportJson(card)).toBe(
      '{\n  "title": "Titre",\n  "summary": "Résumé",\n  "model": "Claude Opus 5.5",\n  "content": "## A\\n\\n\\"quote\\"",\n  "estimated_time": 12\n}',
    )
  })

  it('keeps null values as null', () => {
    const json = JSON.parse(toImportJson({ ...card, model: null, estimatedTime: null }))
    expect(json.model).toBeNull()
    expect(json.estimated_time).toBeNull()
  })

  it('round-trips through parseImportJson', () => {
    expect(parseImportJson(toImportJson(card))).toEqual({
      ok: true,
      data: { title: 'Titre', summary: 'Résumé', model: 'Claude Opus 5.5', content: '## A\n\n"quote"', estimatedTime: 12 },
    })
  })
})
