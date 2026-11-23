import type { Structure } from '../lib/structures'

export interface StructureGuide {
  /** Two short lines: what it is, and how to use it. */
  explanation: [string, string]
  /** One original example line. */
  example: string
}

/** Written for PunchLab; examples are original. */
export const STRUCTURE_GUIDE: Record<Structure, StructureGuide> = {
  Exaggeration: {
    explanation: [
      'Take one true detail and inflate it until it breaks reality.',
      'Pick the detail first, then push it one step further than feels safe.',
    ],
    example: "Our building's lift is so slow, the watchman hands you a tiffin before the doors close.",
  },
  Reversal: {
    explanation: [
      'Set up the usual roles or outcome, then flip who does what.',
      'The surprise comes from swapping power, direction or status.',
    ],
    example: "Mom doesn't check my phone anymore. Now I check hers, to see what I'm being blamed for in the family group.",
  },
  'Literal interpretation': {
    explanation: [
      'Treat a figure of speech or an instruction as if it were meant word for word.',
      'The gap between what was meant and what was said is the joke.',
    ],
    example: "Boss said, \"Leave your ego at the door.\" Now there's a pile outside the meeting room and nobody's claiming theirs.",
  },
  Comparison: {
    explanation: [
      'Explain one thing by linking it to something from a completely different world.',
      'The more specific and unexpected the match, the harder it lands.',
    ],
    example: 'Our family WhatsApp group is a news channel with no editor and fourteen anchors.',
  },
  Dialogue: {
    explanation: [
      'Act the moment out as a short exchange instead of describing it.',
      'Two voices let people see the scene, and the reply carries the punch.',
    ],
    example: "Me: \"Bhaiya, meter se chaloge?\" Auto driver: \"Meter bhi chalega, hum bhi chalenge. Bas saath mein nahi.\"",
  },
  Callback: {
    explanation: [
      'Bring back an earlier line or detail in a new context.',
      'It rewards people for paying attention and feels like a shared secret.',
    ],
    example:
      'Earlier: "Dad is just resting his eyes every afternoon." Later, at the wedding: "Dad rested his eyes very devotedly through all seven pheras."',
  },
  Wordplay: {
    explanation: [
      'Play with the sound, spelling or double meaning of a word.',
      'It works best when the pun also says something true about the situation.',
    ],
    example: "Office ka AC itna tez hai ki hum colleagues nahi rahe, ab 'cool-eagues' hain.",
  },
  Misdirection: {
    explanation: [
      'Lead people toward one assumption, then reveal a different meaning at the end.',
      'Hide the twist in the last few words so it lands all at once.',
    ],
    example:
      'I meet someone every morning, same time, same spot. Three months in, she finally spoke to me: "Next station, Rajiv Chowk."',
  },
  'Specific detail': {
    explanation: [
      'Swap a general word for an exact one: a brand, a number, a name.',
      'Specifics feel true, and true things are easier to laugh at.',
    ],
    example: 'My uncle reuses the rubber band from the newspaper to seal his Parle-G packet. Twice.',
  },
  'Free choice': {
    explanation: ['Use any structure you like, or none.', 'Go with whatever angle feels funniest right now.'],
    example: '',
  },
}
