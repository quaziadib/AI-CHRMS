'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto flex items-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold">Health Project</span>
          </Link>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Password reset is not available in this demo. Please contact your administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>Demo credentials:</p>
          <p className="mt-1 font-medium">Admin: admin@health.local / admin123</p>
          <p className="font-medium">User: demo@health.local / demo123</p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/login">
            <Button variant="outline">Back to Login</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
