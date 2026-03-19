import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Activity, 
  Shield, 
  Users, 
  FileText, 
  Heart,
  ClipboardList,
  Lock,
  BarChart3
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold">Health Project</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Secure Health Data Collection & Management
            </h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground md:text-xl">
              A comprehensive platform for healthcare professionals to collect, manage, 
              and analyze patient health data with enterprise-grade security.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  <ClipboardList className="mr-2 h-5 w-5" />
                  Start Collecting Data
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="border-t bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Everything you need for health data management
              </h2>
              <p className="mt-4 text-muted-foreground">
                Built with security and compliance in mind, our platform provides 
                all the tools healthcare professionals need.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-card">
                <CardHeader>
                  <FileText className="h-10 w-10 text-primary" />
                  <CardTitle className="mt-4">Multi-Step Forms</CardTitle>
                  <CardDescription>
                    Intuitive 8-step health assessment forms with auto-save and validation
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-card">
                <CardHeader>
                  <Shield className="h-10 w-10 text-primary" />
                  <CardTitle className="mt-4">Secure Storage</CardTitle>
                  <CardDescription>
                    NID hashing, encrypted data, and comprehensive audit logging
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-card">
                <CardHeader>
                  <Users className="h-10 w-10 text-primary" />
                  <CardTitle className="mt-4">Role-Based Access</CardTitle>
                  <CardDescription>
                    Admin and user roles with granular permission controls
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-card">
                <CardHeader>
                  <BarChart3 className="h-10 w-10 text-primary" />
                  <CardTitle className="mt-4">Admin Dashboard</CardTitle>
                  <CardDescription>
                    Comprehensive analytics and user management tools
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>

        {/* Form Sections Preview */}
        <div className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Comprehensive Health Assessment
              </h2>
              <p className="mt-4 text-muted-foreground">
                Our multi-step form covers all essential health metrics and lifestyle factors
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { step: 1, title: 'Demographics', desc: 'Basic patient information' },
                { step: 2, title: 'Family History', desc: 'Hereditary conditions' },
                { step: 3, title: 'Medical History', desc: 'Personal health records' },
                { step: 4, title: 'Vital Signs', desc: 'BP, height, weight, BMI' },
                { step: 5, title: 'Lab Tests', desc: 'Blood work and diagnostics' },
                { step: 6, title: 'Clinical Visit', desc: 'Symptoms and diagnosis' },
                { step: 7, title: 'Lifestyle', desc: 'Habits and activities' },
                { step: 8, title: 'Review', desc: 'Summary and submit' },
              ].map((section) => (
                <Card key={section.step} className="bg-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                        {section.step}
                      </div>
                      <div>
                        <p className="font-medium">{section.title}</p>
                        <p className="text-sm text-muted-foreground">{section.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="border-t bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Enterprise-Grade Security
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Your patient data is protected with industry-standard security measures 
                  and compliance protocols.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    { icon: Lock, text: 'NID hashing with SHA-256 and unique salts' },
                    { icon: Shield, text: 'JWT authentication with refresh tokens' },
                    { icon: Activity, text: 'Comprehensive audit logging' },
                    { icon: Users, text: 'Role-based access control (RBAC)' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle>Demo Credentials</CardTitle>
                  <CardDescription>
                    Try the platform with these test accounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <p className="font-medium">Admin Account</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Email: admin@health.local<br />
                      Password: admin123
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="font-medium">Demo User Account</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Email: demo@health.local<br />
                      Password: demo123
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <span className="font-medium">Health Project</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Secure health data collection and management platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
