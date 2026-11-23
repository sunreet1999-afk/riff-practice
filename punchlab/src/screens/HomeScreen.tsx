import { AppShell } from '../components/AppShell'
import { BigButton } from '../components/BigButton'

/** Placeholder home; the real prompt, streak and drill flow arrive in Phase 2. */
export function HomeScreen() {
  return (
    <AppShell title="PunchLab">
      <section className="rounded-2xl bg-surface p-5">
        <p className="text-muted">Today's prompt</p>
        <p className="mt-2 text-lg">Setup complete. The daily drill arrives in Phase 2.</p>
      </section>
      <div className="mt-auto">
        <BigButton disabled>Start Drill</BigButton>
      </div>
    </AppShell>
  )
}
