import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  title: string
  /** Optional element on the right of the header (e.g. a back link). */
  action?: ReactNode
  /** Pinned to the bottom, inside thumb reach. */
  footer?: ReactNode
  /** Show the main bottom navigation (top-level screens only). */
  nav?: boolean
  children: ReactNode
}

/** Single-column layout capped for one-handed use on ~380px screens. */
export function AppShell({ title, action, footer, nav = false, children }: AppShellProps) {
  const hasBottom = footer !== undefined || nav
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <header className="flex min-h-14 items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {action}
      </header>
      <main className="flex flex-1 flex-col gap-4 pb-4">{children}</main>
      {hasBottom && (
        <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-line bg-bg/95 px-4 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur">
          {footer}
          {nav && <BottomNav />}
        </div>
      )}
    </div>
  )
}
