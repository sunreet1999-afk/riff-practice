import { describe, expect, it } from 'vitest'
import { buildIdeaRequest, buildSearchRequest, ideaToPromptText, parseIdea } from './ideaPrompt'

describe('buildIdeaRequest', () => {
  it('asks for a situation (no jokes) as JSON, with the meme described for meme prompts', () => {
    const text = buildIdeaRequest('meme')
    expect(text).toContain('a well-known meme format popular in India')
    expect(text).toContain('Do NOT write any jokes or punchlines yourself.')
    expect(text).toContain('Describe the meme in 1-2 sentences')
    expect(text).toContain("body, appearance, religion or caste")
    expect(text).toContain('{"title": "3-6 word name", "meme": "description or empty string", "situation": "the situation"}')
  })

  it('lists recent prompts to avoid, trimmed and capped at 10', () => {
    const recent = Array.from({ length: 12 }, (_, i) => `prompt ${i + 1}`)
    const text = buildIdeaRequest('office', ['  ', ...recent])
    expect(text).toContain('office or work life in India')
    expect(text).toContain('Avoid repeating these prompts I already used:\n- prompt 1')
    expect(text).toContain('- prompt 10')
    expect(text).not.toContain('- prompt 11')
  })

  it('leaves out the avoid list when there is none', () => {
    expect(buildIdeaRequest('family')).not.toContain('Avoid repeating')
  })
})

describe('buildSearchRequest', () => {
  it('asks a chat AI to search the web and reply in a pasteable format', () => {
    const text = buildSearchRequest('meme')
    expect(text.startsWith('Search the web for a meme that is trending in India this week')).toBe(true)
    expect(text).toContain('SITUATION: <2-3 sentences>')
    expect(text).toContain('SOURCE: <link where I can see it>')
    expect(buildSearchRequest('college')).toContain('something trending in India this week about college or hostel life in India')
  })
})

describe('parseIdea', () => {
  it('accepts a complete idea and trims it', () => {
    expect(parseIdea({ title: ' Distracted boyfriend ', meme: ' Man looks back… ', situation: ' Dost ne naya phone liya. ' })).toEqual({
      title: 'Distracted boyfriend',
      meme: 'Man looks back…',
      situation: 'Dost ne naya phone liya.',
    })
  })

  it('rejects anything without a situation', () => {
    expect(parseIdea(null)).toBeNull()
    expect(parseIdea('text')).toBeNull()
    expect(parseIdea({ title: 'x', situation: '  ' })).toBeNull()
    expect(parseIdea({ situation: 'ok' })).toEqual({ title: '', meme: '', situation: 'ok' })
  })
})

describe('ideaToPromptText', () => {
  it('adds the meme description under the situation when there is one', () => {
    expect(ideaToPromptText({ title: 't', meme: 'Two buttons, sweating guy', situation: 'Biryani ya diet?' })).toBe(
      'Biryani ya diet?\n\nMeme: Two buttons, sweating guy',
    )
    expect(ideaToPromptText({ title: 't', meme: '', situation: 'Biryani ya diet?' })).toBe('Biryani ya diet?')
  })
})
