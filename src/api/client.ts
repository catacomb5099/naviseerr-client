const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

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

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const body = response.headers.get('content-type')?.includes('application/json')
        ? await response.json().catch(() => undefined)
        : undefined
      throw new ApiError(
        `API request failed: ${response.statusText}`,
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
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
