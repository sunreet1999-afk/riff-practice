import { Link } from 'react-router-dom'

export function BackLink({ to = '/', label = 'Back' }: { to?: string; label?: string }) {
  return (
    <Link to={to} className="flex min-h-12 items-center rounded-xl px-3 text-muted active:bg-surface">
      {label}
    </Link>
  )
}
