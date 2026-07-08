import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import SidebarNavItem from './SidebarNavItem'

function renderItem(props: Partial<React.ComponentProps<typeof SidebarNavItem>> = {}) {
  return render(
    <MemoryRouter>
      <SidebarNavItem
        to="/categories/1"
        label="Java"
        count={3}
        active={false}
        icon={<span data-testid="icon">icon</span>}
        {...props}
      />
    </MemoryRouter>
  )
}

describe('SidebarNavItem', () => {
  it('renders the label, icon and count', () => {
    renderItem()

    expect(screen.getByText('Java')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('links to the given destination', () => {
    renderItem({ to: '/categories/42' })

    expect(screen.getByRole('link')).toHaveAttribute('href', '/categories/42')
  })

  it('applies the active style when active is true', () => {
    renderItem({ active: true })

    expect(screen.getByRole('link').className).toContain('text-sidebar-active')
  })

  it('applies the inactive style when active is false', () => {
    renderItem({ active: false })

    expect(screen.getByRole('link').className).toContain('text-muted')
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    renderItem({ onClick })

    await userEvent.click(screen.getByRole('link'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('displays a count of 0 without hiding the badge', () => {
    renderItem({ count: 0 })

    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
