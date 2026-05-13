export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null
const REQUEST_TIMEOUT_MS = 20_000

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('access_token', token)
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('refresh_token')
}

async function refreshAccessToken(): Promise<string | null> {
  // Prevent multiple simultaneous refresh requests
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true

  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        // No refresh token available, must re-login
        redirectToLogin()
        return null
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      )

      const json = (await res.json()) as {
        data: { access_token: string }
        message: string
        statusCode: number
      }

      if (!res.ok) {
        // Refresh failed, redirect to login
        redirectToLogin()
        return null
      }

      const newAccessToken = json.data.access_token
      setAccessToken(newAccessToken)
      return newAccessToken
    } catch {
      // Network error or other issue, redirect to login
      redirectToLogin()
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

function redirectToLogin(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  window.location.href = '/login'
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
  retryCount = 0,
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
    if (res.status === 401 && retryCount < 1) {
      const newToken = await refreshAccessToken()
      if (newToken) {
        return apiRequest<T>(method, path, body, retryCount + 1)
      }
    }
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
