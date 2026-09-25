import type { LucideIcon } from "lucide-react"
import {
  Heart,
  ClipboardList,
  FileText,
  User,
  Shield,
  Stethoscope,
  Globe,
  MessageCircle,
  Users,
} from "lucide-react"

export type DashboardNavItem = {
  name: string
  href: string
  icon: LucideIcon
}

export type WorkspaceMeta = {
  label: "Patient" | "Doctor" | "National" | "Admin"
  icon: LucideIcon
}

/** Patient-only destinations — must not appear on doctor (or other elevated) primary nav. */
export const NAV_PATIENT: DashboardNavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Heart },
  { name: "Health Form", href: "/health-form", icon: ClipboardList },
  { name: "My Records", href: "/records", icon: FileText },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Messages", href: "/messages", icon: MessageCircle },
]

/** Doctor clinical workspace — must not include patient health-form / records / patient dashboard. */
export const NAV_DOCTOR: DashboardNavItem[] = [
  { name: "Doctor Dashboard", href: "/doctor", icon: Stethoscope },
  { name: "Patients", href: "/doctor/patients", icon: Users },
  { name: "Messages", href: "/messages", icon: MessageCircle },
  { name: "Profile", href: "/profile", icon: User },
]

export const NAV_NATIONAL: DashboardNavItem[] = [
  { name: "National Dashboard", href: "/national", icon: Globe },
  { name: "Profile", href: "/profile", icon: User },
]

export const NAV_ADMIN: DashboardNavItem[] = [
  { name: "Admin Dashboard", href: "/admin", icon: Shield },
  { name: "National Overview", href: "/national", icon: Globe },
  { name: "Profile", href: "/profile", icon: User },
]

export const ROLE_HOMES: Record<string, string> = {
  admin: "/admin",
  doctor: "/doctor",
  national_admin: "/national",
  user: "/dashboard",
}

const PATIENT_CLINICAL_HREFS = new Set(["/dashboard", "/health-form", "/records"])
const DOCTOR_CLINICAL_PREFIXES = ["/doctor"]

function isDoctorClinicalHref(href: string): boolean {
  return DOCTOR_CLINICAL_PREFIXES.some(
    (prefix) => href === prefix || href.startsWith(`${prefix}/`),
  )
}

/** Assert patient vs doctor primary navs stay non-overlapping (shared profile/messages OK). */
export function assertPatientDoctorNavExclusive(): void {
  for (const item of NAV_DOCTOR) {
    if (PATIENT_CLINICAL_HREFS.has(item.href)) {
      throw new Error(`Doctor nav must not include patient destination: ${item.href}`)
    }
  }
  for (const item of NAV_PATIENT) {
    if (isDoctorClinicalHref(item.href)) {
      throw new Error(`Patient nav must not include doctor destination: ${item.href}`)
    }
  }
}

/** Active sidebar state: Patients owns /doctor/patients*; Doctor Dashboard owns other /doctor paths. */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname.startsWith("/admin")
  if (href === "/doctor/patients") {
    return pathname === "/doctor/patients" || pathname.startsWith("/doctor/patients/")
  }
  if (href === "/doctor") {
    return pathname === "/doctor" || (pathname.startsWith("/doctor/") && !pathname.startsWith("/doctor/patients"))
  }
  if (href === "/national") return pathname.startsWith("/national")
  return pathname === href
}

assertPatientDoctorNavExclusive()

export function getNavItems(roles: string[]): DashboardNavItem[] {
  if (roles.includes("admin")) return NAV_ADMIN
  if (roles.includes("doctor")) return NAV_DOCTOR
  if (roles.includes("national_admin")) return NAV_NATIONAL
  return NAV_PATIENT
}

/** Same role precedence as getNavItems; uses effective JWT roles only (ignores pending requested_role). */
export function getWorkspaceMeta(roles: string[]): WorkspaceMeta {
  if (roles.includes("admin")) return { label: "Admin", icon: Shield }
  if (roles.includes("doctor")) return { label: "Doctor", icon: Stethoscope }
  if (roles.includes("national_admin")) return { label: "National", icon: Globe }
  return { label: "Patient", icon: Heart }
}

export function getRoleHome(roles: string[]): string {
  for (const role of ["admin", "doctor", "national_admin"]) {
    if (roles.includes(role)) return ROLE_HOMES[role]
  }
  return ROLE_HOMES.user
}
