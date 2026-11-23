import { describe, expect, it, vi } from 'vitest'
import { shareText } from './share'

describe('shareText', () => {
  it('uses the Web Share API when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn()
    expect(await shareText('hello', { share, clipboard: { writeText } })).toBe('shared')
    expect(share).toHaveBeenCalledWith({ text: 'hello' })
    expect(writeText).not.toHaveBeenCalled()
  })

  it('treats closing the share sheet as cancelled', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('closed', 'AbortError'))
    const writeText = vi.fn()
    expect(await shareText('hi', { share, clipboard: { writeText } })).toBe('cancelled')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('falls back to the clipboard when sharing is unsupported or fails', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    expect(await shareText('Bhai 😂', { clipboard: { writeText } })).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('Bhai 😂')

    const share = vi.fn().mockRejectedValue(new DOMException('nope', 'NotAllowedError'))
    expect(await shareText('x', { share, clipboard: { writeText } })).toBe('copied')

    const canShare = vi.fn().mockReturnValue(false)
    expect(await shareText('x', { share, canShare, clipboard: { writeText } })).toBe('copied')
  })

  it('reports failure when nothing works', async () => {
    expect(await shareText('x', {})).toBe('failed')
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    expect(await shareText('x', { clipboard: { writeText } })).toBe('failed')
  })
})
