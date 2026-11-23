export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

/** The parts of `navigator` the share flow needs; injectable for tests. */
export interface ShareEnv {
  share?: (data: ShareData) => Promise<void>
  canShare?: (data: ShareData) => boolean
  clipboard?: { writeText: (text: string) => Promise<void> }
}

/**
 * Shares text with the Web Share API, falling back to the clipboard.
 * A user closing the share sheet counts as 'cancelled', not a failure.
 */
export async function shareText(text: string, env: ShareEnv = navigator): Promise<ShareResult> {
  const data: ShareData = { text }
  if (env.share && (!env.canShare || env.canShare(data))) {
    try {
      await env.share(data)
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
      // Any other error (e.g. not allowed): fall through to the clipboard.
    }
  }
  if (env.clipboard) {
    try {
      await env.clipboard.writeText(text)
      return 'copied'
    } catch {
      return 'failed'
    }
  }
  return 'failed'
}
