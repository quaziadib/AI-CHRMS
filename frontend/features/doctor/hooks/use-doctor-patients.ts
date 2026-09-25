'use client'

import useSWR from 'swr'
import { doctorApi } from '@/lib/api'
import type { DoctorPatientListItem } from '@/lib/api'

export type DoctorPatientFilters = {
  risk_level?: string
  district?: string
}

function patientsKey(filters?: DoctorPatientFilters) {
  const params = new URLSearchParams()
  if (filters?.risk_level) params.set('risk_level', filters.risk_level)
  if (filters?.district) params.set('district', filters.district)
  const query = params.toString()
  return query ? `/doctor/patients?${query}` : '/doctor/patients'
}

export function useDoctorPatients(filters?: DoctorPatientFilters) {
  const key = patientsKey(filters)

  const { data, error, isLoading } = useSWR<DoctorPatientListItem[]>(key, () =>
    doctorApi.getPatients(filters).then((res) => res.data ?? []),
  )

  return {
    patients: data ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
