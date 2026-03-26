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
  Users,
  Database,
  MessageSquare,
  BrainCircuit,
  Handshake,
  UserPlus,
} from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

// Per-role navigation config
const NAV_BY_ROLE: Record<string, { name: string; href: string; icon: React.ElementType }[]> = {
  admin: [
    { name: "Admin Dashboard", href: "/admin", icon: Shield },
    { name: "AI Health Chat", href: "/chat", icon: MessageSquare },
    { name: "Profile", href: "/profile", icon: User },
  ],
  co_pi: [
    { name: "Manage Collectors", href: "/collectors", icon: Users },
    { name: "Consent Requests", href: "/consent", icon: Handshake },
    { name: "AI Health Chat", href: "/chat", icon: MessageSquare },
    { name: "Profile", href: "/profile", icon: User },
  ],
  data_collector: [
    { name: "Register Patient", href: "/patients/new", icon: UserPlus },
    { name: "My Patients", href: "/patients", icon: Users },
    { name: "AI Health Chat", href: "/chat", icon: MessageSquare },
    { name: "Profile", href: "/profile", icon: User },
  ],
  ml_engineer: [
    { name: "ML Dataset", href: "/ml", icon: BrainCircuit },
    { name: "AI Health Chat", href: "/chat", icon: MessageSquare },
    { name: "Profile", href: "/profile", icon: User },
  ],
  patient: [
    { name: "My Records", href: "/records", icon: FileText },
    { name: "Consent", href: "/consent", icon: Handshake },
    { name: "AI Health Chat", href: "/chat", icon: MessageSquare },
    { name: "Profile", href: "/profile", icon: User },
  ],
  user: [
    { name: "Health Form", href: "/health-form", icon: ClipboardList },
    { name: "My Records", href: "/records", icon: FileText },
    { name: "Datasets", href: "/datasets", icon: Database },
    { name: "AI Health Chat", href: "/chat", icon: MessageSquare },
    { name: "Profile", href: "/profile", icon: User },
  ],
};

function getRoleLabel(roles: string[]): string {
  if (roles.includes("admin")) return "Administrator";
  if (roles.includes("co_pi")) return "Co-PI";
  if (roles.includes("data_collector")) return "Data Collector";
  if (roles.includes("ml_engineer")) return "ML Engineer";
  if (roles.includes("patient")) return "Patient";
  return "General User";
}

function getNavItems(roles: string[]) {
  if (roles.includes("admin")) return NAV_BY_ROLE.admin;
  if (roles.includes("co_pi")) return NAV_BY_ROLE.co_pi;
  if (roles.includes("data_collector")) return NAV_BY_ROLE.data_collector;
  if (roles.includes("ml_engineer")) return NAV_BY_ROLE.ml_engineer;
  if (roles.includes("patient")) return NAV_BY_ROLE.patient;
  return NAV_BY_ROLE.user;
}

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
    }
  }, [isLoading, isAuthenticated, router]);

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

  if (!isAuthenticated) return null;

  const navItems = getNavItems(user?.roles ?? []);
  const roleLabel = getRoleLabel(user?.roles ?? []);

  return (
    <div className="min-h-screen flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 px-6 border-b">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-lg font-semibold">AI-CHRMS</span>
            <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Role badge */}
          <div className="px-6 py-3 border-b">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {roleLabel}
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = item.href === "/patients"
                ? pathname === "/patients" || pathname.startsWith("/patients/")
                : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium shrink-0">
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start mt-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b bg-card flex items-center px-4 lg:px-6">
          <button className="lg:hidden p-2 -ml-2" onClick={() => setSidebarOpen(true)}>
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
          <div key={pathname} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
