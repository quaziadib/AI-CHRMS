'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle, ChevronLeft, ChevronRight, Save, Check, RefreshCw } from 'lucide-react'

import { useHealthForm } from '@/features/health-form/hooks/use-health-form'
import { StepDemographics } from '@/features/health-form/components/step-demographics'
import { StepFamilyHistory } from '@/features/health-form/components/step-family-history'
import { StepMedicalHistory } from '@/features/health-form/components/step-medical-history'
import { StepVitalSigns } from '@/features/health-form/components/step-vital-signs'
import { StepLabResults } from '@/features/health-form/components/step-lab-results'
import { StepClinical } from '@/features/health-form/components/step-clinical'
import { StepLifestyle } from '@/features/health-form/components/step-lifestyle'
import { FormReview } from '@/features/health-form/components/form-review'
import { RiskResult } from '@/features/health-form/components/risk-result'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { stepTitles } from '@/lib/health-form-schema'

export default function HealthFormPage() {
  const router = useRouter()

  const {
    form,
    currentStep,
    setCurrentStep,
    totalSteps,
    progress,
    isSubmitting,
    resubmitStatus,
    resubmitError,
    showDraftPrompt,
    riskResult,
    handleNext,
    handlePrevious,
    handleSubmit,
    restoreDraft,
    discardDraft,
    handleSaveDraft,
  } = useHealthForm({ onSuccess: () => {} })

  if (riskResult) {
    return <RiskResult record={riskResult} onContinue={() => router.push('/dashboard')} />
  }

  if (resubmitStatus === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!resubmitStatus.can_submit_new && resubmitStatus.submission_count > 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Resubmit not yet due
            </CardTitle>
            <CardDescription>
              Your last assessment was submitted on{' '}
              {resubmitStatus.latest_submission_at
                ? new Date(resubmitStatus.latest_submission_at).toLocaleDateString('en-GB')
                : '—'}
              . The next resubmit is due on{' '}
              <strong>
                {resubmitStatus.next_due_at
                  ? new Date(resubmitStatus.next_due_at).toLocaleDateString('en-GB')
                  : '—'}
              </strong>{' '}
              (every {resubmitStatus.interval_months} months). You can edit your latest record from My Records.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            <Button variant="outline" onClick={() => router.push('/records')}>
              My Records
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showDraftPrompt) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Unsaved Draft Found
            </CardTitle>
            <CardDescription>
              You have an unsaved health assessment draft. Would you like to continue where you left off?
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={restoreDraft}>
              Continue Draft
            </Button>
            <Button variant="outline" onClick={discardDraft}>
              Start Fresh
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isResubmit = resubmitStatus.submission_count > 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {resubmitError && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-4 text-sm text-amber-900">
            Resubmit check failed ({resubmitError}). Showing the form anyway — submission may still be rejected by the server.
          </CardContent>
        </Card>
      )}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          {isResubmit && <RefreshCw className="h-6 w-6 text-primary" />}
          {isResubmit ? 'Resubmit Health Assessment' : 'Health Assessment Form'}
        </h1>
        <p className="text-muted-foreground">
          {isResubmit
            ? 'Submit a new assessment — your previous submissions will be kept in your history.'
            : 'Complete all sections to submit your health record'}
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-4">
            {stepTitles.map((title, index) => (
              <button
                key={title}
                onClick={() => setCurrentStep(index + 1)}
                className={`flex flex-col items-center ${
                  index + 1 <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index + 1 < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : index + 1 === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {index + 1 < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs mt-1 hidden md:block">{title}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && <StepDemographics form={form} />}
          {currentStep === 2 && <StepFamilyHistory form={form} />}
          {currentStep === 3 && <StepMedicalHistory form={form} />}
          {currentStep === 4 && <StepVitalSigns form={form} />}
          {currentStep === 5 && <StepLabResults form={form} />}
          {currentStep === 6 && <StepClinical form={form} />}
          {currentStep === 7 && <StepLifestyle form={form} />}
          {currentStep === 8 && <FormReview form={form} />}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleSaveDraft}
          >
            <Save className="h-4 w-4 mr-1" />
            Save Draft
          </Button>
        </div>

        {currentStep < totalSteps ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                {isResubmit ? 'Submit Resubmission' : 'Submit Assessment'}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
