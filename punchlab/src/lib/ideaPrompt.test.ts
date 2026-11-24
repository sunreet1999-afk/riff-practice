import { describe, expect, it } from 'vitest'
import { buildIdeaRequest, buildSearchRequest, ideaToPromptText, parseIdea } from './ideaPrompt'

describe('buildIdeaRequest', () => {
  it('asks for a desi dank situation (no jokes) as JSON, with a real meme format described', () => {
    const text = buildIdeaRequest('dank')
    expect(text).toContain('a well-known desi meme format from Indian dank meme pages')
    expect(text).toContain('"boys level" humour')
    expect(text).toContain('Not sophisticated, not news or politics')
    expect(text).toContain('nothing sexually explicit')
    expect(text).toContain('Name a meme format you are sure exists')
    expect(text).toContain('Do NOT write any jokes or punchlines yourself.')
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
    expect(buildIdeaRequest('family')).toContain('Only use meme formats you are sure exist.')
  })
})

describe('buildSearchRequest', () => {
  it('asks a chat AI to search the web for a viral desi meme and reply in a pasteable format', () => {
    const text = buildSearchRequest('dank')
    expect(text.startsWith('Search the web for a desi meme going viral in India this week (r/IndianDankMemes')).toBe(true)
    expect(text).toContain('"boys level" humour')
    expect(text).toContain('SITUATION: <2-3 sentences>')
    expect(text).toContain('SOURCE: <link where I can see it>')
    expect(buildSearchRequest('hostel')).toContain('that fits boys hostel, PG or college dosti life in India')
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
