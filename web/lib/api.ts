export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const REQUEST_TIMEOUT_MS = 20_000

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

export function getApiBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '')
  if (configuredUrl) return configuredUrl

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`
  }

  throw new ApiError(500, 'API URL is not configured')
}

async function parseApiResponse<T>(res: Response): Promise<T> {
  const json = (await res.json().catch(() => null)) as {
    data?: T
    message?: string
  } | null

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json?.message ?? 'Request failed',
    )
  }

  return json?.data as T
}

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getAccessToken()
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  )

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    return parseApiResponse<T>(res)
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(0, 'The server took too long to respond. Please try again.')
    }
    throw new ApiError(0, 'Unable to reach the server. Please check your connection and try again.')
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

export const apiClient = {
  get: <T>(path: string) => apiRequest<T>('GET', path),
  post: <T>(path: string, body?: unknown) => apiRequest<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => apiRequest<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>('PATCH', path, body),
  delete: <T>(path: string) => apiRequest<T>('DELETE', path),
}
