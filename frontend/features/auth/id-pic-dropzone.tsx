'use client'

import { useId, useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export const ID_PIC_MAX_BYTES = 1_000_000

interface IdPicDropzoneProps {
  fileName: string
  /** Called with a base64 data URL and file name, or null when cleared. */
  onChange: (value: { dataUrl: string; name: string } | null) => void
}

export function IdPicDropzone({ fileName, onChange }: IdPicDropzoneProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File | undefined) => {
    if (!file) {
      onChange(null)
      return
    }
    if (!file.type.startsWith('image/') || file.size > ID_PIC_MAX_BYTES) {
      toast.error('ID picture must be an image under 1 MB')
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange({ dataUrl: String(reader.result), name: file.name })
    reader.onerror = () => toast.error('Could not read the selected file')
    reader.readAsDataURL(file)
  }

  const clear = () => {
    if (inputRef.current) inputRef.current.value = ''
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>ID picture (Optional)</Label>
      <div
        className="flex items-center gap-3 rounded-lg border border-dashed p-4 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFile(e.dataTransfer.files?.[0])
        }}
      >
        <ImagePlus className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1 text-sm">
          {fileName ? (
            <p className="truncate font-medium" title={fileName}>{fileName}</p>
          ) : (
            <p>
              <label htmlFor={inputId} className="cursor-pointer font-medium text-primary hover:underline">
                Choose an image
              </label>{' '}
              <span className="text-muted-foreground">or drop it here</span>
            </p>
          )}
          <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
            Shown only to admins reviewing your request. Max 1 MB.
          </p>
        </div>
        {fileName && (
          <Button type="button" variant="ghost" size="icon" onClick={clear} aria-label="Remove ID picture">
            <X className="h-4 w-4" />
          </Button>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-describedby={`${inputId}-hint`}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  )
}
