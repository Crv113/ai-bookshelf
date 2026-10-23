import { useCallback, useEffect, useRef, useState } from 'react'

export type CopyStatus = 'idle' | 'copied' | 'failed'

const FEEDBACK_MS = 2000

export function useCopyToClipboard(): [CopyStatus, (text: string) => Promise<void>] {
  const [status, setStatus] = useState<CopyStatus>('idle')
  const timerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => window.clearTimeout(timerRef.current)
  }, [])

  const copy = useCallback(async (text: string) => {
    let ok = true
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      ok = false
    }
    setStatus(ok ? 'copied' : 'failed')
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setStatus('idle'), FEEDBACK_MS)
  }, [])

  return [status, copy]
}
