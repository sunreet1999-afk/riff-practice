/**
 * Minimal, typed access to the Claude Artifact `mcp` capability, used to run
 * a web search through the viewer's Firecrawl connector. Null outside an
 * artifact or when the viewer hasn't connected Firecrawl.
 */

export const SEARCH_TOOL = 'firecrawl_search'

interface ServerInfo {
  server: string
  tools: { name: string }[]
}

export interface McpLike {
  listTools(): Promise<{ servers: ServerInfo[] }>
  callTool(server: string, tool: string, input?: unknown, options?: { signal?: AbortSignal; cache?: false }): Promise<{ payload?: unknown }>
}

interface ClaudeHost {
  use(name: string): Promise<unknown>
}

function isMcp(value: unknown): value is McpLike {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.listTools === 'function' && typeof v.callTool === 'function'
}

export interface SearchConnector {
  mcp: McpLike
  /** The connector's display name as this viewer has it (e.g. "Firecrawl"). */
  server: string
}

/** Finds the viewer's Firecrawl connector with its search tool, or null. */
export async function getSearchConnector(): Promise<SearchConnector | null> {
  const host = (globalThis as { claude?: ClaudeHost }).claude
  if (!host || typeof host.use !== 'function') return null
  try {
    const mcp = await host.use('mcp')
    if (!isMcp(mcp)) return null
    const { servers } = await mcp.listTools()
    const match = servers.find((s) => /firecrawl/i.test(s.server) && s.tools.some((t) => t.name === SEARCH_TOOL))
    return match ? { mcp, server: match.server } : null
  } catch {
    return null
  }
}

export function mcpErrorCode(err: unknown): string {
  if (typeof err === 'object' && err !== null && typeof (err as { code?: unknown }).code === 'string') return (err as { code: string }).code
  return 'upstream_error'
}

/** Viewer-facing copy for a failed search, by error code. */
export function searchErrorMessage(code: string, server: string): string {
  switch (code) {
    case 'needs_reauth':
      return `Reconnect ${server} in claude.ai Settings → Connectors to search memes.`
    case 'server_not_connected':
    case 'server_not_found':
      return `Add the ${server} connector in claude.ai Settings → Connectors to search memes.`
    case 'selection_required':
      return `Choose which ${server} connector to use when claude.ai asks, then try again.`
    case 'not_in_manifest':
    case 'approval_required':
    case 'not_granted':
      return `Search needs your OK to use ${server}. Allow it when claude.ai asks.`
    case 'blocked_by_policy':
      return `Your organization doesn't allow ${server} here.`
    case 'server_unavailable':
      return `${server} isn't answering right now. Try again in a minute.`
    case 'tool_error':
      return `${server} couldn't run the search (maybe out of credits). Try again later.`
    default:
      return "Couldn't search right now. Try again."
  }
}

/** Codes after which search stays off for this view (the fix is outside the page). */
export const PERMANENT_SEARCH_ERRORS = new Set([
  'needs_reauth',
  'server_not_connected',
  'server_not_found',
  'blocked_by_policy',
  'not_granted',
  'capability_disabled',
  'capability_removed',
])
