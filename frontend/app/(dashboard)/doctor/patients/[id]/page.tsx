'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ClipboardPlus, FileText, RefreshCw, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { RecordDetail } from '@/features/records/components/record-detail'
import { useDoctorPatient } from '@/features/doctor/hooks/use-doctor-patient'
import { PrescriptionPanel, type PanelMode } from '@/features/prescriptions/prescription-panel'
import { useDoctorPrescriptions } from '@/features/prescriptions/usePrescriptions'
import { doctorApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { DoctorPatientProfile } from '@/lib/api'

export default function DoctorPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = use(params)
  const { patient: initialPatient, isLoading, error } = useDoctorPatient(patientId)
  const [patient, setPatient] = useState<DoctorPatientProfile | null>(null)
  const [accessLost, setAccessLost] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [panelMode, setPanelMode] = useState<PanelMode | null>(null)
  const [panelDirty, setPanelDirty] = useState(false)
  const { data: prescriptions } = useDoctorPrescriptions(patientId)
  const hasPrescription = (prescriptions?.length ?? 0) > 0

  const profile = accessLost ? null : (patient ?? initialPatient)
  const latestRecord = profile?.latest_record

  const clearAccess = (message: string) => {
    setPatient(null)
    setAccessLost(true)
    toast.error(message)
  }

  const closePanel = () => {
    if (panelDirty && !window.confirm('Discard unsaved prescription changes?')) return
    setPanelDirty(false)
    setPanelMode(null)
  }

  const handleSummarize = async () => {
    setIsSummarizing(true)
    const { data, error: err, status } = await doctorApi.summarize(patientId)
    setIsSummarizing(false)
    if (data && profile) {
      const records = profile.records.map((record) => record.id === data.id ? data : record)
      setPatient({ ...profile, latest_record: data, records })
      toast.success('Clinical summary generated')
    } else if (status === 403 || status === 404) {
      clearAccess(err ?? 'Patient profile not found or access is no longer active.')
    } else {
      toast.error(err ?? 'Failed to generate summary')
    }
  }

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  if (error || accessLost || !profile) {
    return <div className="space-y-4"><Link href="/doctor/patients"><Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Back to patients</Button></Link><p className="text-muted-foreground">Patient profile not found or access is no longer active.</p></div>
  }

  return (
    <div className={panelMode ? 'grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,40%)]' : ''}>
    <div className="min-w-0 space-y-5">
      <Link href="/doctor/patients"><Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Back to patients</Button></Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2"><Stethoscope className="h-5 w-5 text-blue-600" /></div>
              <div><CardTitle>{profile.patient_name}</CardTitle><CardDescription>Shared longitudinal health profile · {profile.records.length} health record{profile.records.length === 1 ? '' : 's'}</CardDescription></div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
            {hasPrescription && <Button variant={panelMode === 'view' ? 'secondary' : 'outline'} size="sm" onClick={() => setPanelMode('view')}><ClipboardPlus className="mr-2 h-4 w-4" />View prescription</Button>}
            <Button variant={panelMode === 'compose' ? 'secondary' : 'outline'} size="sm" onClick={() => setPanelMode('compose')}><ClipboardPlus className="mr-2 h-4 w-4" />Write prescription</Button>
            {latestRecord && <Button variant={latestRecord.ehr_summary ? 'outline' : 'default'} size="sm" onClick={handleSummarize} disabled={isSummarizing}>
              {isSummarizing ? <><Spinner size="sm" className="mr-2" />Generating…</> : latestRecord.ehr_summary ? <><RefreshCw className="mr-2 h-4 w-4" />Regenerate Summary</> : <><FileText className="mr-2 h-4 w-4" />Generate Summary</>}
            </Button>}
            </div>
          </div>
        </CardHeader>
        {latestRecord?.ehr_summary && <CardContent className="pt-0"><div className="rounded-lg border bg-muted/40 p-4 space-y-2"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clinical Summary</p>{latestRecord.ehr_summary_at && <p className="text-xs text-muted-foreground">Generated {formatDate(latestRecord.ehr_summary_at)}</p>}</div><p className="text-sm leading-relaxed">{latestRecord.ehr_summary}</p></div></CardContent>}
      </Card>

      <section className="space-y-3"><h2 className="text-lg font-semibold">Previous health records</h2>
        {profile.records.length === 0 ? <p className="text-sm text-muted-foreground">No health assessments recorded.</p> : profile.records.map((record) => <Card key={record.id}><CardHeader className="pb-3"><CardTitle className="text-base">Assessment · {formatDate(record.created_at)}</CardTitle><CardDescription>{record.age} yrs · {record.gender} · {record.district}</CardDescription></CardHeader><RecordDetail record={record} readOnly /></Card>)}
      </section>
    </div>
    {panelMode && (
      <PrescriptionPanel
        patientId={patientId}
        patientName={profile.patient_name}
        mode={panelMode}
        onModeChange={setPanelMode}
        onClose={closePanel}
        onDirtyChange={setPanelDirty}
      />
    )}
    </div>
  )
}
