'use client'

import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Input } from '@/components/ui/input'

type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type'>

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false)
    return (
      <div className="relative">
        <Input ref={ref} type={visible ? 'text' : 'password'} className="pr-10" {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    )
  },
)
