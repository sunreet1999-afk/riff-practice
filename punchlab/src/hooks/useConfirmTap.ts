import { useEffect, useRef, useState } from 'react'

/**
 * Two-tap confirmation without browser dialogs (which some hosts, like
 * embedded previews, block). The first tap arms; a second tap within
 * `timeoutMs` runs the action; otherwise it disarms.
 */
export function useConfirmTap(timeoutMs = 3000) {
  const [armed, setArmed] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function tap(action: () => void) {
    window.clearTimeout(timer.current)
    if (armed) {
      setArmed(false)
      action()
      return
    }
    setArmed(true)
    timer.current = window.setTimeout(() => setArmed(false), timeoutMs)
  }

  return { armed, tap }
}
