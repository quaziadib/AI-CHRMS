"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  ClipboardList,
  FileText,
  User,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  Stethoscope,
  Globe,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { ChatWidget } from "@/features/chatbot/components/chat-widget";

const NAV_PATIENT = [
  { name: "Dashboard", href: "/dashboard", icon: Heart },
  { name: "Health Form", href: "/health-form", icon: ClipboardList },
  { name: "My Records", href: "/records", icon: FileText },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Messages", href: "/messages", icon: MessageCircle },
];

const NAV_DOCTOR = [
  { name: "Doctor Dashboard", href: "/doctor", icon: Stethoscope },
  { name: "Messages", href: "/messages", icon: MessageCircle },
  { name: "Profile", href: "/profile", icon: User },
];

const NAV_NATIONAL = [
  { name: "National Dashboard", href: "/national", icon: Globe },
  { name: "Profile", href: "/profile", icon: User },
];

const NAV_ADMIN = [
  { name: "Admin Dashboard", href: "/admin", icon: Shield },
  { name: "Profile", href: "/profile", icon: User },
];

const ROLE_HOMES: Record<string, string> = {
  admin: "/admin",
  doctor: "/doctor",
  national_admin: "/national",
  user: "/dashboard",
};

function getNavItems(roles: string[]) {
  if (roles.includes("admin")) return NAV_ADMIN;
  if (roles.includes("doctor")) return NAV_DOCTOR;
  if (roles.includes("national_admin")) return NAV_NATIONAL;
  return NAV_PATIENT;
}

function getRoleHome(roles: string[]): string {
  for (const role of ["admin", "doctor", "national_admin"]) {
    if (roles.includes(role)) return ROLE_HOMES[role];
  }
  return ROLE_HOMES.user;
}

const ROLE_GUARDS: Array<{ prefix: string; requiredRole: string }> = [
  { prefix: "/admin", requiredRole: "admin" },
  { prefix: "/doctor", requiredRole: "doctor" },
  { prefix: "/national", requiredRole: "national_admin" },
];

const PATIENT_ONLY_PREFIXES = ["/dashboard", "/health-form", "/records"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!isLoading && isAuthenticated && user) {
      for (const guard of ROLE_GUARDS) {
        if (pathname.startsWith(guard.prefix) && !user.roles.includes(guard.requiredRole)) {
          router.replace(getRoleHome(user.roles));
          return;
        }
      }
      const isNonPatient = user.roles.some(r => ["admin", "doctor", "national_admin"].includes(r));
      if (isNonPatient && PATIENT_ONLY_PREFIXES.some(p => pathname.startsWith(p))) {
        router.replace(getRoleHome(user.roles));
        return;
      }
      if (pathname.startsWith("/messages")) {
        const isDoctor = user.roles.includes("doctor") && !user.roles.some(r => ["admin", "national_admin"].includes(r));
        const isPatient = user.roles.some(r => ["user", "patient"].includes(r)) && !isNonPatient;
        if (!isDoctor && !isPatient) {
          router.replace(getRoleHome(user.roles));
          return;
        }
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const roles = user?.roles ?? [];
  const navItems = getNavItems(roles);

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-2 px-6 border-b">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-lg font-semibold">Health Project</span>
            <button
              className="ml-auto lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const isActive = item.href === "/admin"
                ? pathname.startsWith(item.href)
                : item.href === "/doctor"
                  ? pathname.startsWith(item.href)
                  : pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={false}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t p-4">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start mt-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b bg-card flex items-center px-4 lg:px-6">
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <Link href="/profile">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </header>

        <main className="flex-1 p-4 lg:p-6 bg-background">
          <div
            key={pathname}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            {children}
          </div>
        </main>
      </div>

      {roles.includes("user") && !roles.includes("admin") && <ChatWidget />}
    </div>
  );
}
