'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api'
import type { User, PatientRecord } from '@/lib/api'

export function useAdmin() {
  const [users, setUsers] = useState<User[]>([])
  const [records, setRecords] = useState<PatientRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.getUsers(),
      adminApi.getAllRecords(),
    ]).then(([usersRes, recordsRes]) => {
      if (usersRes.data) setUsers(usersRes.data)
      if (recordsRes.data) setRecords(recordsRes.data)
    }).catch(() => {
      toast.error('Failed to load admin data')
    }).finally(() => {
      setIsLoading(false)
    })
  }, [])

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    const { error } = await adminApi.updateUser(userId, { roles: [newRole] })
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, roles: [newRole] } : u))
      toast.success('User role updated')
    } else {
      toast.error('Failed to update role')
    }
  }

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    const { error } = await adminApi.updateUser(userId, { is_active: isActive })
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: isActive } : u))
      toast.success(`User ${isActive ? 'activated' : 'deactivated'}`)
    } else {
      toast.error('Failed to update status')
    }
  }

  const downloadCSV = () => {
    const headers = [
      'PID', 'Submitted By', 'Email', 'Age', 'Gender', 'District',
      'BP Systolic', 'BP Diastolic', 'Height (cm)', 'Weight (kg)', 'BMI', 'Pulse Rate',
      'Diabetes History', 'Hypertension', 'CVD', 'Stroke',
      'Family Diabetes', 'Family Hypertension', 'Family CVD', 'Family Stroke',
      'Allergies', 'Pregnancies',
      'Blood Glucose (mg/dL)', 'Cholesterol (mg/dL)', 'Hemoglobin (g/dL)', 'Creatinine (mg/dL)', 'ECG Result',
      'Smoking', 'Physical Activity', 'Alcohol', 'Sleep Hours', 'Sound Sleep',
      'Symptoms', 'Diagnosis', 'Date Submitted',
    ]
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = records.map(r => {
      const u = users.find(u => u.id === r.user_id)
      return [
        r.pid, u?.full_name ?? '', u?.email ?? '', r.age, r.gender, r.district,
        r.bp_systolic, r.bp_diastolic, r.height, r.weight, r.bmi, r.pulse_rate,
        r.diabetes_history, r.hypertension, r.cvd, r.stroke,
        r.family_diabetes, r.family_hypertension, r.family_cvd, r.family_stroke,
        r.allergies ?? '', r.pregnancies ?? '',
        r.blood_glucose ?? '', r.cholesterol ?? '', r.hemoglobin ?? '', r.creatinine ?? '', r.ecg_result ?? '',
        r.smoking, r.physical_activity, r.alcohol, r.sleep_hours, r.sound_sleep,
        r.symptoms ?? '', r.diagnosis ?? '',
        new Date(r.created_at).toLocaleDateString(),
      ].map(escape).join(',')
    })
    const csv = [headers.map(escape).join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `health-records-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.is_active).length,
    totalRecords: records.length,
    admins: users.filter(u => u.roles.includes('admin')).length,
  }

  return {
    users,
    records,
    isLoading,
    stats,
    handleRoleChange,
    handleStatusChange,
    downloadCSV,
  }
}
