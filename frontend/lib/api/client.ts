import type { ApiResponse } from './types'

const API_BASE = '/api/v1'
const ACCESS_TOKEN_KEY = 'health_access_token'
const REFRESH_TOKEN_KEY = 'health_refresh_token'

class ApiClient {
  private accessToken: string | null = null
  private isRefreshing = false

  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  getAccessToken(): string | null {
    return this.accessToken
  }

  /** Try to get a new access token using the stored refresh token.
   *  Returns true if successful, false otherwise. */
  private async tryRefresh(): Promise<boolean> {
    if (this.isRefreshing) return false
    this.isRefreshing = true

    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
      if (!refreshToken) return false

      // Use raw fetch to avoid going through the interceptor again
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (!res.ok) return false

      const data = await res.json()
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token)
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
      this.accessToken = data.access_token
      return true
    } catch {
      return false
    } finally {
      this.isRefreshing = false
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      })

      const status = response.status

      // Auto-refresh on 401, then retry the original request once
      if (status === 401 && retry) {
        const refreshed = await this.tryRefresh()
        if (refreshed) {
          return this.request<T>(endpoint, options, false)
        }
        // Refresh failed — wipe session and send to login
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        this.accessToken = null
        window.location.href = '/login'
        return { error: 'Session expired. Please log in again.', status: 401 }
      }

      if (status === 204) {
        return { status }
      }

      const data = await response.json()

      if (!response.ok) {
        const detail = data.detail
        const errorMessage = Array.isArray(detail)
          ? detail.map((e: { msg: string }) => e.msg).join('; ')
          : typeof detail === 'string' ? detail : data.message || 'An error occurred'
        return { error: errorMessage, status }
      }

      return { data, status }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      }
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const api = new ApiClient()
