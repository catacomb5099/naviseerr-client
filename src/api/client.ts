import { share } from '../lib/requestCache'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiOptions extends RequestInit {
  /** GET only: how long a successful answer is reused for the same URL. 0 (the default) shares only
   *  a request already in flight, for data that must stay live. */
  cacheMs?: number
  /** GET only: forget a reused answer and ask again. Still joins a request already in flight. */
  fresh?: boolean
}

/**
 * GETs to the same URL share one request and, if asked, one answer for a while; everything else goes
 * straight to fetch. The caller's `signal` still detaches that caller alone.
 */
export function apiClient<T>(endpoint: string, options?: ApiOptions): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const { cacheMs, fresh, signal, ...init } = options ?? {}
  if (init.method && init.method.toUpperCase() !== 'GET') return request<T>(url, { ...init, signal })
  return share(url, s => request<T>(url, { ...init, signal: s }), { signal: signal ?? undefined, cacheMs, fresh })
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        // Only with a body: on a GET this header is not on the CORS safe list, so the browser would
        // send an OPTIONS preflight first - the second row per request in the Network tab.
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })

    if (!response.ok) {
      throw new ApiError(
        `API request failed: ${response.statusText}`,
        response.status,
        response.statusText
      )
    }

    // Handle void responses (like download endpoint)
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return undefined as T
    }

    return response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    // An aborted request is not a network failure, and rewrapping it here is why callers that
    // check `err.name === 'AbortError'` never matched - every superseded poll logged an error.
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
