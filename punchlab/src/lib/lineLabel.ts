import type { DrillLine } from '../types'

/** "Line N", plus the structure label older drills were written with. */
export function lineLabel(line: DrillLine): string {
  return line.structure ? `${line.slot + 1}. ${line.structure}` : `Line ${line.slot + 1}`
}
