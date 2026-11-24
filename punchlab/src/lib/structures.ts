export const STRUCTURES = [
  'Exaggeration',
  'Reversal',
  'Literal interpretation',
  'Comparison',
  'Dialogue',
  'Callback',
  'Wordplay',
  'Misdirection',
  'Specific detail',
  'Free choice',
] as const

export type Structure = (typeof STRUCTURES)[number]
