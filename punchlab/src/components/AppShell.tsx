import type { ReactNode } from 'react'

interface AppShellProps {
  title: string
  children: ReactNode
}

/** Single-column layout capped for one-handed use on ~380px screens. */
export function AppShell({ title, children }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="py-3">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </header>
      <main className="flex flex-1 flex-col gap-4">{children}</main>
    </div>
  )
}
