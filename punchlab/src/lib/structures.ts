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

export const SLOT_COUNT = 10

/** Structure label shown above a drill slot; rotates through the list and wraps. */
export function structureForSlot(slot: number): Structure {
  const n = STRUCTURES.length
  return STRUCTURES[((slot % n) + n) % n]
}
