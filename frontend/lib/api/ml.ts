import { api } from './client'

export const mlApi = {
  getData: (params?: { skip?: number; limit?: number; verified_only?: boolean }) => {
    const q = new URLSearchParams()
    if (params?.skip !== undefined) q.set('skip', String(params.skip))
    if (params?.limit !== undefined) q.set('limit', String(params.limit))
    if (params?.verified_only !== undefined) q.set('verified_only', String(params.verified_only))
    const qs = q.toString()
    return api.get<{ total: number; returned: number; skip: number; limit: number; data: Record<string, unknown>[] }>(`/ml/data${qs ? `?${qs}` : ''}`)
  },
}
