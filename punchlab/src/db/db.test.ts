import { afterEach, describe, expect, it } from 'vitest'
import { PunchLabDB } from './db'

describe('PunchLabDB', () => {
  const testDb = new PunchLabDB('punchlab-test')

  afterEach(async () => {
    await testDb.settings.clear()
  })

  it('saves and loads a setting, including Hinglish text', async () => {
    await testDb.settings.put({ key: 'greeting', value: 'Aaj kuch funny dekha? 😄' })
    const row = await testDb.settings.get('greeting')
    expect(row?.value).toBe('Aaj kuch funny dekha? 😄')
  })
})
