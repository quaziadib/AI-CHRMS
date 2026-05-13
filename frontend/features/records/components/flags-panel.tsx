import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AbnormalityFlag } from '@/lib/api/types'

interface FlagsPanelProps {
  flags: AbnormalityFlag[] | null | undefined
}

export function FlagsPanel({ flags }: FlagsPanelProps) {
  if (flags === null || flags === undefined) return null

  if (flags.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
        <span className="text-sm text-green-700 font-medium">No abnormal values detected</span>
      </div>
    )
  }

  const critical = flags.filter(f => f.severity === 'critical')
  const warnings = flags.filter(f => f.severity === 'warning')

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
        <span className="text-sm font-semibold">
          Abnormal Values
          <span className="ml-1.5 text-muted-foreground font-normal">
            ({flags.length} flag{flags.length !== 1 ? 's' : ''})
          </span>
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {critical.map((flag, i) => (
          <FlagBadge key={i} flag={flag} />
        ))}
        {warnings.map((flag, i) => (
          <FlagBadge key={i} flag={flag} />
        ))}
      </div>

      <div className="space-y-1">
        {flags.map((flag, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <span className={cn(
              "mt-0.5 w-1.5 h-1.5 rounded-full shrink-0",
              flag.severity === 'critical' ? "bg-red-500" : "bg-amber-500"
            )} />
            <span>
              <span className="font-medium text-foreground">{flag.label}</span>
              {' — '}{flag.value} {flag.unit}
              <span className="ml-1 text-muted-foreground/70">({flag.reference})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FlagBadge({ flag }: { flag: AbnormalityFlag }) {
  const isCritical = flag.severity === 'critical'
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
      isCritical
        ? "bg-red-100 text-red-700 border border-red-200"
        : "bg-amber-100 text-amber-700 border border-amber-200"
    )}>
      <AlertTriangle className="h-3 w-3" />
      {flag.label}
    </span>
  )
}
