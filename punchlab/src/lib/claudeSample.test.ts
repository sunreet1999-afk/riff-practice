import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSample, sampleErrorCode } from './claudeSample'

afterEach(() => {
  delete (globalThis as { claude?: unknown }).claude
})

describe('getSample', () => {
  it('is null outside a Claude Artifact', async () => {
    expect(await getSample()).toBeNull()
  })

  it('returns the sample function when the host provides it', async () => {
    const sample = Object.assign(vi.fn(), { json: vi.fn() })
    ;(globalThis as { claude?: unknown }).claude = { use: vi.fn().mockResolvedValue(sample) }
    expect(await getSample()).toBe(sample)
  })

  it('is null when the host has no sample or fails', async () => {
    ;(globalThis as { claude?: unknown }).claude = { use: vi.fn().mockResolvedValue(null) }
    expect(await getSample()).toBeNull()
    ;(globalThis as { claude?: unknown }).claude = { use: vi.fn().mockRejectedValue(new Error('x')) }
    expect(await getSample()).toBeNull()
  })
})

describe('sampleErrorCode', () => {
  it('reads the code, defaulting to upstream_error', () => {
    expect(sampleErrorCode({ code: 'rate_limited', message: 'x' })).toBe('rate_limited')
    expect(sampleErrorCode(new Error('boom'))).toBe('upstream_error')
  })
})
