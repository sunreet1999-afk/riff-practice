import { describe, expect, it } from 'vitest'
import { buildMemeIdeaRequest, parseSearchPayload, searchInput, sourceHit, type SearchHit } from './memeSearch'

describe('searchInput', () => {
  it('searches last week of news and web, with the required objective', () => {
    const input = searchInput('meme')
    expect(input).toMatchObject({ query: 'viral meme India', sources: ['news', 'web'], tbs: 'qdr:w', limit: 8 })
    expect(typeof input.objective).toBe('string')
    expect(searchInput('office').query).toBe('viral office meme India')
  })
})

describe('parseSearchPayload', () => {
  // Shape observed from a real firecrawl_search call (values made up here).
  const payload = {
    success: true,
    data: {
      news: [
        { title: 'Meme A goes viral', url: 'https://news.example/a', date: '2 days ago', imageUrl: 'https://img/x' },
        { title: 'Bad link', url: 'http://insecure.example/b' },
      ],
      web: [
        { title: 'Meme A goes viral again', url: 'https://news.example/a', description: 'dupe' },
        { title: 'Compilation', url: 'https://video.example/c', description: 'Lots of memes' },
        { title: '', url: 'https://empty.example' },
        'junk',
      ],
    },
  }

  it('keeps https results, news first, without duplicates', () => {
    expect(parseSearchPayload(payload)).toEqual([
      { title: 'Meme A goes viral', url: 'https://news.example/a', description: '', date: '2 days ago' },
      { title: 'Compilation', url: 'https://video.example/c', description: 'Lots of memes', date: '' },
    ])
  })

  it('handles empty or odd payloads', () => {
    expect(parseSearchPayload(null)).toEqual([])
    expect(parseSearchPayload({ data: {} })).toEqual([])
    expect(parseSearchPayload('text')).toEqual([])
  })
})

describe('buildMemeIdeaRequest and sourceHit', () => {
  const hits: SearchHit[] = [
    { title: 'GTA 6 vs GTA 5 meme', url: 'https://a.example/1', description: 'Everyone compares before and after', date: '4 days ago' },
    { title: 'Village phrase trend', url: 'https://b.example/2', description: '', date: '' },
  ]

  it('lists numbered results and asks for a JSON pick with its source number', () => {
    const text = buildMemeIdeaRequest('meme', hits, ['old prompt'])
    expect(text).toContain('[1] GTA 6 vs GTA 5 meme (4 days ago)\n    Everyone compares before and after\n    https://a.example/1')
    expect(text).toContain('[2] Village phrase trend\n    https://b.example/2')
    expect(text).toContain('Do NOT write any jokes or punchlines yourself.')
    expect(text).toContain('Prefer non-political memes.')
    expect(text).toContain('Pick something different from these, which I already used or saw:\n- old prompt')
    expect(text).toContain('"source": 1}')
    expect(buildMemeIdeaRequest('college', hits)).toContain('Set the situation in college or hostel life.')
  })

  it('maps the source number back to a real result only', () => {
    expect(sourceHit({ source: 2 }, hits)?.url).toBe('https://b.example/2')
    expect(sourceHit({ source: '1' }, hits)?.url).toBe('https://a.example/1')
    expect(sourceHit({ source: 3 }, hits)).toBeNull()
    expect(sourceHit({ source: 0 }, hits)).toBeNull()
    expect(sourceHit({}, hits)).toBeNull()
  })
})
