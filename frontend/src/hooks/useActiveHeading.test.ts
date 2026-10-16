import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useActiveHeading } from './useActiveHeading'

let observerCallback: IntersectionObserverCallback

function intersect(id: string, isIntersecting: boolean) {
  const target = document.getElementById(id)!
  act(() => {
    observerCallback([{ target, isIntersecting } as unknown as IntersectionObserverEntry], {} as IntersectionObserver)
  })
}

describe('useActiveHeading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.body.innerHTML = '<h2 id="a">A</h2><h2 id="b">B</h2><h2 id="c">C</h2>'
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          observerCallback = callback
        }
        observe() {}
        disconnect() {}
      },
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('follows the heading visible at the top while reading', () => {
    const { result } = renderHook(() => useActiveHeading(['a', 'b', 'c']))

    intersect('b', true)

    expect(result.current[0]).toBe('b')
  })

  it('keeps the clicked heading active while the page scrolls to it', () => {
    const { result } = renderHook(() => useActiveHeading(['a', 'b', 'c']))

    act(() => result.current[1]('c'))
    intersect('b', true)
    act(() => {
      window.dispatchEvent(new Event('scroll'))
      vi.advanceTimersByTime(100)
    })
    intersect('b', false)

    expect(result.current[0]).toBe('c')
  })

  it('resumes following the reading once scrolling has stopped', () => {
    const { result } = renderHook(() => useActiveHeading(['a', 'b', 'c']))

    act(() => result.current[1]('c'))
    act(() => vi.advanceTimersByTime(200))
    intersect('a', true)

    expect(result.current[0]).toBe('a')
  })
})
