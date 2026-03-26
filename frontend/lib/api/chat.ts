import { api } from './client'

export const chatApi = {
  send: (message: string) =>
    api.post<{ response: string; disclaimer: string; model: string }>('/chat', { message }),
}
