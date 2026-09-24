'use client'

import useSWR from 'swr'
import { doctorApi } from '@/lib/api'
import type { DoctorPatientListItem } from '@/lib/api'

export function useDoctorPatients(riskLevel?: string) {
  const key = riskLevel ? `/doctor/patients?risk_level=${riskLevel}` : '/doctor/patients'

  const { data, error, isLoading } = useSWR<DoctorPatientListItem[]>(key, () =>
    doctorApi.getPatients(riskLevel ? { risk_level: riskLevel } : undefined)
      .then(res => res.data ?? [])
  )

  return {
    patients: data ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
