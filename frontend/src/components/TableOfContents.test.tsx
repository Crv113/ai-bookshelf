import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TableOfContents from './TableOfContents'
import type { TocItem } from '../types/toc'

const items: TocItem[] = [
  { id: 'introduction', text: 'Introduction' },
  { id: 'details', text: 'Détails' },
]

describe('TableOfContents', () => {
  it('renders a link per heading pointing to its anchor', () => {
    render(<TableOfContents items={items} activeId={null} onNavigate={vi.fn()} />)

    expect(screen.getByRole('navigation', { name: 'Sommaire' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Introduction' })).toHaveAttribute('href', '#introduction')
    expect(screen.getByRole('link', { name: 'Détails' })).toHaveAttribute('href', '#details')
  })

  it('renders nothing with fewer than two headings', () => {
    const { container, rerender } = render(<TableOfContents items={[]} activeId={null} onNavigate={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()

    rerender(<TableOfContents items={[items[0]]} activeId={null} onNavigate={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('calls onNavigate with the heading id on click', async () => {
    const onNavigate = vi.fn()
    render(<TableOfContents items={items} activeId={null} onNavigate={onNavigate} />)

    await userEvent.click(screen.getByRole('link', { name: 'Détails' }))

    expect(onNavigate).toHaveBeenCalledWith('details')
  })

  it('marks the active heading', () => {
    render(<TableOfContents items={items} activeId="details" onNavigate={vi.fn()} />)

    expect(screen.getByRole('link', { name: 'Détails' })).toHaveAttribute('aria-current', 'location')
    expect(screen.getByRole('link', { name: 'Introduction' })).not.toHaveAttribute('aria-current')
  })
})
