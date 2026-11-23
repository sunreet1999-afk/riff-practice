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

/** The first lines of a drill follow the structures in order; after that every line is free. */
export const STRUCTURED_SLOTS = STRUCTURES.length

/** Structure label for a drill slot: the list in order for slots 0–9, then "Free choice". */
export function structureForSlot(slot: number): Structure {
  if (slot < 0 || slot >= STRUCTURED_SLOTS) return 'Free choice'
  return STRUCTURES[slot]
}
