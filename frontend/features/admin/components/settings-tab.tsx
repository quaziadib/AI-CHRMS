'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { adminApi } from '@/lib/api'
import type { SystemSettings } from '@/lib/api'

interface SettingsTabProps {
  settings: SystemSettings | null
  onUpdated: (settings: SystemSettings) => void
}

export function SettingsTab({ settings, onUpdated }: SettingsTabProps) {
  const [months, setMonths] = useState(String(settings?.resubmit_interval_months ?? 6))
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    const value = parseInt(months, 10)
    if (Number.isNaN(value) || value < 1 || value > 36) {
      toast.error('Enter a value between 1 and 36 months')
      return
    }
    setIsSaving(true)
    const { data, error } = await adminApi.updateSettings({ resubmit_interval_months: value })
    if (data && !error) {
      onUpdated(data)
      toast.success('Resubmit interval updated')
    } else {
      toast.error(error || 'Failed to update settings')
    }
    setIsSaving(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-5 w-5" />
          System Settings
        </CardTitle>
        <CardDescription>
          Control how often patients must resubmit their health assessment. All historical submissions are retained.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="resubmit-months">Resubmit interval (months)</Label>
          <Input
            id="resubmit-months"
            type="number"
            min={1}
            max={36}
            value={months}
            onChange={(e) => setMonths(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Patients see a resubmit prompt when this many months have passed since their last submission.
          </p>
        </div>
        {settings?.updated_at && (
          <p className="text-xs text-muted-foreground">
            Last updated {new Date(settings.updated_at).toLocaleString('en-GB')}
          </p>
        )}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  )
}
