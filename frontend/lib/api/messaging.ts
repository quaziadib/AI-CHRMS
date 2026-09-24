import { api } from './client'
import type {
  PatientDoctorConversation,
  PatientDoctorConversationSummary,
  PatientDoctorMessage,
} from './types'

export const messagingApi = {
  getInbox: () => api.get<PatientDoctorConversationSummary[]>('/messages'),
  openConversation: (participant_id: string) =>
    api.post<PatientDoctorConversationSummary>('/messages/conversations', { participant_id }),
  getConversation: (id: string) =>
    api.get<PatientDoctorConversation>(`/messages/conversations/${id}`),
  sendMessage: (id: string, content: string) =>
    api.post<PatientDoctorMessage>(`/messages/conversations/${id}/messages`, { content }),
  markRead: (id: string) =>
    api.post<{ unread_count: number }>(`/messages/conversations/${id}/read`),
}
