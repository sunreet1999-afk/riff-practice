const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null

/**
 * User-perceived character count. Counts graphemes, so Devanagari conjuncts with
 * matras and emoji count as the user sees them, not as UTF-16 code units.
 */
export function charCount(text: string): number {
  if (!segmenter) return Array.from(text).length
  return Array.from(segmenter.segment(text)).length
}
