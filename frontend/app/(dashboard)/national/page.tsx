'use client'

import { Globe, Construction } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function NationalDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">National Health Dashboard</h1>
        <p className="text-muted-foreground">Aggregate health data across Bangladesh</p>
      </div>

      <Card className="border-dashed">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-purple-50">
              <Globe className="h-12 w-12 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-xl">Coming in Phase 3</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            National-level aggregate analytics, district heat maps, and population health
            trend reporting will be available in Phase 3.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pt-2 pb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Construction className="h-4 w-4" />
            Under development
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
