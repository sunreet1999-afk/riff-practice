import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSearchConnector, mcpErrorCode, searchErrorMessage } from './claudeMcp'

afterEach(() => {
  delete (globalThis as { claude?: unknown }).claude
})

function host(servers: { server: string; tools: { name: string }[] }[]) {
  const mcp = { listTools: vi.fn().mockResolvedValue({ servers }), callTool: vi.fn() }
  ;(globalThis as { claude?: unknown }).claude = { use: vi.fn().mockResolvedValue(mcp) }
  return mcp
}

describe('getSearchConnector', () => {
  it('is null outside an artifact', async () => {
    expect(await getSearchConnector()).toBeNull()
  })

  it("finds the viewer's Firecrawl connector by display name, whatever its case", async () => {
    const mcp = host([{ server: 'Firecrawl', tools: [{ name: 'firecrawl_search' }] }])
    expect(await getSearchConnector()).toEqual({ mcp, server: 'Firecrawl' })
  })

  it('is null when Firecrawl or its search tool is missing', async () => {
    host([{ server: 'Firecrawl', tools: [] }])
    expect(await getSearchConnector()).toBeNull()
    host([])
    expect(await getSearchConnector()).toBeNull()
  })
})

describe('search errors', () => {
  it('gives a specific fix per code', () => {
    expect(mcpErrorCode({ code: 'needs_reauth' })).toBe('needs_reauth')
    expect(mcpErrorCode('x')).toBe('upstream_error')
    expect(searchErrorMessage('needs_reauth', 'Firecrawl')).toContain('Reconnect Firecrawl')
    expect(searchErrorMessage('server_not_connected', 'Firecrawl')).toContain('Add the Firecrawl connector')
    expect(searchErrorMessage('tool_error', 'Firecrawl')).toContain('credits')
    expect(searchErrorMessage('weird', 'Firecrawl')).toBe("Couldn't search right now. Try again.")
  })
})
