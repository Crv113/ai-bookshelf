import type { FlashCardResponse } from '../types/flashcard'

export const INVALID_JSON_ERROR = 'JSON invalide. Vérifiez la syntaxe.'
export const MISSING_FIELDS_ERROR = 'Le JSON doit contenir title, summary, content, model et estimated_time.'

export interface ImportJsonData {
  title: string
  summary: string
  content: string
  model: string
  estimatedTime: number
}

export type ParseImportJsonResult = { ok: true; data: ImportJsonData } | { ok: false; error: string }

interface RawImportJson {
  title?: string
  summary?: string
  content?: string
  model?: string
  estimated_time?: string | number
}

export function parseImportJson(raw: string): ParseImportJsonResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: INVALID_JSON_ERROR }
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: MISSING_FIELDS_ERROR }
  }
  const { title, summary, content, model, estimated_time } = parsed as RawImportJson
  const estimatedTime = Number(estimated_time)
  if (!title || !summary || !content || !model || !(estimatedTime > 0)) {
    return { ok: false, error: MISSING_FIELDS_ERROR }
  }
  return { ok: true, data: { title, summary, content, model, estimatedTime } }
}

export function toImportJson(
  card: Pick<FlashCardResponse, 'title' | 'summary' | 'model' | 'content' | 'estimatedTime'>,
): string {
  return JSON.stringify(
    {
      title: card.title,
      summary: card.summary,
      model: card.model,
      content: card.content,
      estimated_time: card.estimatedTime,
    },
    null,
    2,
  )
}
