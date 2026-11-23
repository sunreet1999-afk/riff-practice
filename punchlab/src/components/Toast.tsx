import { useEffect, useState } from 'react'

/** Short-lived status message. */
export function Toast({ message }: { message: string }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const id = window.setTimeout(() => setVisible(false), 2500)
    return () => window.clearTimeout(id)
  }, [])
  if (!visible) return null
  return (
    <div role="status" className="rounded-xl bg-accent/15 px-4 py-3 text-accent">
      {message}
    </div>
  )
}
