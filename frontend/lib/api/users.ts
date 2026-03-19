import { api } from './client'
import type { User } from './types'

export const usersApi = {
  getProfile: () => api.get<User>('/users/me'),
  updateProfile: (data: Partial<User>) => api.patch<User>('/users/me', data),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/users/me/change-password', data),
}
