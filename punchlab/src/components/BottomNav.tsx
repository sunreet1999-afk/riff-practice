import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/sessions', label: 'Sessions', icon: '📚', end: false },
  { to: '/journal', label: 'Journal', icon: '📝', end: false },
] as const

/** Primary navigation, pinned to the bottom for thumb reach. */
export function BottomNav() {
  return (
    <nav aria-label="Main" className="grid grid-cols-3 gap-1">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex min-h-14 flex-col items-center justify-center rounded-xl text-xs font-semibold ${
              isActive ? 'bg-surface text-accent' : 'text-muted active:bg-surface'
            }`
          }
        >
          <span aria-hidden className="text-xl leading-none">
            {item.icon}
          </span>
          <span className="mt-1">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
