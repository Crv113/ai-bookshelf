import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DevBadge, devWatermarkStyle } from './DevIndicator'

describe('DevIndicator', () => {
  it('shows the DEV badge when enabled', () => {
    render(<DevBadge enabled />)

    expect(screen.getByRole('status', { name: 'Environnement de développement' })).toHaveTextContent('DEV')
  })

  it('renders nothing when disabled', () => {
    const { container } = render(<DevBadge enabled={false} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('provides a repeated DEV watermark as background image', () => {
    expect(devWatermarkStyle.backgroundImage).toMatch(/^url\("data:image\/svg\+xml,.*DEV/)
  })
})
