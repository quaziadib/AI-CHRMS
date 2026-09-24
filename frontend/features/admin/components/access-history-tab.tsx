'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { adminApi } from '@/lib/api'
import type { PatientAccessEvent } from '@/lib/api'

export function AccessHistoryTab({ searchQuery }: { searchQuery: string }) {
  const [events, setEvents] = useState<PatientAccessEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    adminApi.getPatientAccessEvents({ limit: 500 })
      .then(({ data }) => { if (data) setEvents(data) })
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  const query = searchQuery.toLowerCase()
  const visible = events.filter((event) => !query || [event.patient_name, event.doctor_name, event.actor_name, event.event_type].some((value) => value?.toLowerCase().includes(query)))

  if (visible.length === 0) return <Card><CardContent className="py-12 text-center text-muted-foreground">No patient access events found.</CardContent></Card>

  return <div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm"><thead className="bg-muted/50 text-left"><tr><th className="p-3">Patient</th><th className="p-3">Doctor</th><th className="p-3">Event</th><th className="p-3">Actor</th><th className="p-3">Time</th></tr></thead><tbody className="divide-y">{visible.map((event) => <tr key={event.id}><td className="p-3">{event.patient_name ?? event.patient_id}</td><td className="p-3">{event.doctor_name ?? event.doctor_id}</td><td className="p-3 capitalize">{event.event_type.replace(/_/g, ' ')}</td><td className="p-3">{event.actor_name ?? event.actor_id}</td><td className="p-3">{new Date(event.occurred_at).toLocaleString()}</td></tr>)}</tbody></table></div>
}
