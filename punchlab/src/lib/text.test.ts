import { describe, expect, it } from 'vitest'
import { charCount } from './text'

describe('charCount', () => {
  it('counts English and Hinglish (Latin script)', () => {
    expect(charCount('Bhai ye kya hai')).toBe(15)
  })

  it('counts Devanagari graphemes as the user sees them', () => {
    expect(charCount('नमस्ते')).toBe(3)
  })

  it('counts an emoji as one character', () => {
    expect(charCount('lol 😂')).toBe(5)
  })
})
