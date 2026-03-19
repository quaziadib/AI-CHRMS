import { api } from './client'
import type { User } from './types'

export const authApi = {
  register: (data: { email: string; password: string; full_name: string; phone?: string }) =>
    api.post<{ access_token: string; refresh_token: string; user: User }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ access_token: string; refresh_token: string; user: User }>('/auth/login', data),

  refresh: (refreshToken: string) =>
    api.post<{ access_token: string; refresh_token: string }>('/auth/refresh', {
      refresh_token: refreshToken,
    }),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<User>('/auth/me'),
}
