/**
 * Minimal, typed access to the Claude Artifact `sample` capability
 * (ask Claude from the page on the viewer's own account). Only exists when
 * the app runs as a published Claude Artifact; everywhere else it is null.
 */

export interface SampleJsonOptions {
  modelTier?: 'quick' | 'default' | 'complex'
  /** false = always ask again (used for "Another one"). */
  cache?: boolean
  signal?: AbortSignal
}

export interface SampleFn {
  json(input: string, options?: SampleJsonOptions): Promise<unknown>
}

export interface SampleError {
  code: string
  message?: string
}

interface ClaudeHost {
  use(name: string): Promise<unknown>
}

function isSampleFn(value: unknown): value is SampleFn {
  return typeof value === 'function' && typeof (value as { json?: unknown }).json === 'function'
}

/** Resolves the `sample` function, or null when this view can't ask Claude. */
export async function getSample(): Promise<SampleFn | null> {
  const host = (globalThis as { claude?: ClaudeHost }).claude
  if (!host || typeof host.use !== 'function') return null
  try {
    const sample = await host.use('sample')
    return isSampleFn(sample) ? sample : null
  } catch {
    return null
  }
}

export function sampleErrorCode(err: unknown): string {
  if (typeof err === 'object' && err !== null && typeof (err as SampleError).code === 'string') return (err as SampleError).code
  return 'upstream_error'
}

/** Codes after which the feature stays hidden for this view (never re-ask). */
export const PERMANENT_SAMPLE_ERRORS = new Set([
  'not_granted',
  'sampling_disabled',
  'not_declared',
  'capability_disabled',
  'capability_removed',
])
