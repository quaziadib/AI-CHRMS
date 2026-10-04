"use client"

import useSWR from 'swr'
import { prescriptionsApi } from '@/lib/api'
import type { PrescriptionListItem, PrescriptionResponse } from '@/lib/api'

async function fetchDoctorPrescriptions(patientId: string): Promise<PrescriptionListItem[]> {
  const res = await prescriptionsApi.doctorList(patientId)
  if (!res.data) throw new Error(res.error ?? 'Failed to load prescriptions')
  return res.data
}

async function fetchPatientPrescriptions(): Promise<PrescriptionListItem[]> {
  const res = await prescriptionsApi.patientList()
  if (!res.data) throw new Error(res.error ?? 'Failed to load prescriptions')
  return res.data
}

async function fetchPrescription(id: string): Promise<PrescriptionResponse> {
  const res = await prescriptionsApi.patientGet(id)
  if (!res.data) throw new Error(res.error ?? 'Prescription not found')
  return res.data
}

export function useDoctorPrescriptions(patientId: string | null) {
  return useSWR<PrescriptionListItem[]>(
    patientId ? `doctor-prescriptions-${patientId}` : null,
    () => fetchDoctorPrescriptions(patientId!),
  )
}

export function usePatientPrescriptions() {
  return useSWR<PrescriptionListItem[]>('patient-prescriptions', fetchPatientPrescriptions)
}

export function usePatientPrescription(id: string | null) {
  return useSWR<PrescriptionResponse>(
    id ? `prescription-${id}` : null,
    () => fetchPrescription(id!),
  )
}
