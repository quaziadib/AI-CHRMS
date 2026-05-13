'use client'

import { useState, useEffect } from 'react'
import { doctorApi } from '@/lib/api'
import type { PatientRecord } from '@/lib/api'

export function useDoctorPatients(riskLevel?: string) {
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    doctorApi.getPatients(riskLevel ? { risk_level: riskLevel } : undefined)
      .then(({ data, error: err }) => {
        if (data) setPatients(data)
        if (err) setError(err)
      })
      .finally(() => setIsLoading(false))
  }, [riskLevel])

  return { patients, isLoading, error }
}
