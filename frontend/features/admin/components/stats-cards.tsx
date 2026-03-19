'use client'

import { Users, FileText, Shield, Activity } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'

interface Stats {
  totalUsers: number
  activeUsers: number
  totalRecords: number
  admins: number
}

interface Props {
  stats: Stats
  isLoading: boolean
}

export function StatsCards({ stats, isLoading }: Props) {
  if (isLoading) return null

  const items = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users },
    { title: 'Active Users', value: stats.activeUsers, icon: Activity },
    { title: 'Health Records', value: stats.totalRecords, icon: FileText },
    { title: 'Administrators', value: stats.admins, icon: Shield },
  ]

  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
      {items.map((item) => (
        <StatCard key={item.title} {...item} />
      ))}
    </div>
  )
}
