import { reportServer } from '../lib/connectivity'
import { share } from '../lib/requestCache'
import { apiErrorMessage } from '../lib/utils'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/** A request the server has not answered in this long counts as unreachable: a hung server (port
 *  open, nothing behind it) would otherwise hold "Searching..." for minutes. The All search takes
 *  up to 9 s on a bad day, so this is well clear of a slow real answer. */
export const REQUEST_TIMEOUT_MS = 20_000
export const OFFLINE_MESSAGE = "You're offline."
export const SERVER_UNREACHABLE_MESSAGE = "Can't reach the Naviseerr server. Check it is running, then try again."

/** The caller's signal plus the timeout where the browser can combine them (Chrome 116+, Safari
 *  17.4+, Firefox 124+); an older browser keeps the caller's signal alone and no timeout. */
function withTimeout(signal: AbortSignal | null | undefined): AbortSignal | undefined {
  if (typeof AbortSignal.timeout !== 'function') return signal ?? undefined
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  if (!signal) return timeout
  return typeof AbortSignal.any === 'function' ? AbortSignal.any([signal, timeout]) : signal
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    /** The parsed JSON body of a non-2xx response, when it had one (a 409 carries the current card). */
    public body: unknown = undefined
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
      signal: withTimeout(init.signal),
      headers: {
        // Only with a body: on a GET this header is not on the CORS safe list, so the browser would
        // send an OPTIONS preflight first - the second row per request in the Network tab.
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })

    // Any answer means the server is there - except a 502/503 from the web app's own proxy, which
    // is what a down server looks like in Docker. On a search path that status is the YouTube
    // helper being down, and the server itself answered.
    const gatewayDown = (response.status === 502 || response.status === 503) && !url.includes('/search/')
    reportServer(!gatewayDown)

    if (!response.ok) {
      const body = response.headers.get('content-type')?.includes('application/json')
        ? await response.json().catch(() => undefined)
        : undefined
      throw new ApiError(
        apiErrorMessage(url, response.status, response.statusText),
        response.status,
        response.statusText,
        body
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
    // Refused, timed out (a TimeoutError, not an AbortError, so it lands here), DNS, or the browser
    // is offline: the pages print err.message, so this is the sentence the user reads.
    reportServer(false)
    throw new Error(navigator.onLine === false ? OFFLINE_MESSAGE : SERVER_UNREACHABLE_MESSAGE)
  }
}
