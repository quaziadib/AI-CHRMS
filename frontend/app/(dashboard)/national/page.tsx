'use client'

import { AlertTriangle, Globe, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNationalRsgi } from '@/features/national/hooks/use-national-rsgi'
import { GeoFilterBar } from '@/features/national/components/geo-filter-bar'
import { IndividualPredictorPanel } from '@/features/national/components/individual-predictor-panel'
import { SpatialRiskMatrix } from '@/features/national/components/spatial-risk-matrix'
import { DemographicsPrevalenceChart, DivisionPrevalenceChart } from '@/features/national/components/national-charts'
import { EpidemicForecastPanel } from '@/features/national/components/epidemic-forecast-panel'

export default function NationalDashboardPage() {
  const {
    divisions,
    districts,
    upazillas,
    thanas,
    divisionId,
    districtId,
    upazillaId,
    thanaId,
    setThanaId,
    spatial,
    divisionChart,
    demoChart,
    prediction,
    epidemic,
    isLoading,
    disabled,
    isPredicting,
    isForecasting,
    onDivisionChange,
    onDistrictChange,
    onUpazillaChange,
    resetFilters,
    runPrediction,
    runEpidemicForecast,
  } = useNationalRsgi()

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading national spatial intelligence…
      </div>
    )
  }

  if (disabled) {
    return (
      <div className="space-y-6">
        <Header />
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              National analytics disabled
            </CardTitle>
            <CardDescription>
              Enable <code>ENABLE_NATIONAL_ANALYTICS</code> on the API to load the live dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header />

      <Card>
        <CardHeader>
          <CardTitle>Hierarchical spatial filter</CardTitle>
          <CardDescription>Division → district → upazilla → thana for localized risk tracking.</CardDescription>
        </CardHeader>
        <CardContent>
          <GeoFilterBar
            divisions={divisions}
            districts={districts}
            upazillas={upazillas}
            thanas={thanas}
            divisionId={divisionId}
            districtId={districtId}
            upazillaId={upazillaId}
            thanaId={thanaId}
            onDivisionChange={onDivisionChange}
            onDistrictChange={onDistrictChange}
            onUpazillaChange={onUpazillaChange}
            onThanaChange={setThanaId}
            onReset={resetFilters}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Individual risk predictor</CardTitle>
            <CardDescription>LLM-based what-if scoring for planners.</CardDescription>
          </CardHeader>
          <CardContent>
            <IndividualPredictorPanel
              onPredict={runPrediction}
              isPredicting={isPredicting}
              prediction={prediction}
            />
          </CardContent>
        </Card>
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Spatial risk matrix</CardTitle>
            <CardDescription>Hotspots and regional metrics for the selected geography.</CardDescription>
          </CardHeader>
          <CardContent>
            <SpatialRiskMatrix spatial={spatial} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Division-wise prevalence</CardTitle>
            <CardDescription>Anonymized high-risk rates across divisions.</CardDescription>
          </CardHeader>
          <CardContent>
            <DivisionPrevalenceChart data={divisionChart} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gender & age demographics</CardTitle>
            <CardDescription>Prevalence by age band and gender (cell-size suppressed).</CardDescription>
          </CardHeader>
          <CardContent>
            <DemographicsPrevalenceChart data={demoChart} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>National epidemic forecast</CardTitle>
          <CardDescription>Multi-year urban/rural trajectory and population risk shares via LLM.</CardDescription>
        </CardHeader>
        <CardContent>
          <EpidemicForecastPanel
            epidemic={epidemic}
            onRun={runEpidemicForecast}
            isForecasting={isForecasting}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function Header() {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-full bg-emerald-50 p-2">
        <Globe className="h-6 w-6 text-emerald-700" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">National Health Dashboard</h1>
        <p className="text-muted-foreground">
          Spatial diabetes intelligence for Bangladesh — LLM predictions, anonymized surveillance
        </p>
      </div>
    </div>
  )
}
