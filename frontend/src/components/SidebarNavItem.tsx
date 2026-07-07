import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface SidebarNavItemProps {
  to: string
  label: string
  count: number
  active: boolean
  icon: ReactNode
  onClick?: () => void
}

export default function SidebarNavItem({ to, label, count, active, icon, onClick }: SidebarNavItemProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-[rgba(255,255,255,0.08)] text-sidebar-active' : 'text-muted hover:bg-[rgba(255,255,255,0.04)]'}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <span
        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-white-subtle text-muted"
      >
        {count}
      </span>
    </Link>
  )
}
