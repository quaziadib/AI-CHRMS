"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { messagingApi } from "@/lib/api";
import type { PatientDoctorConversationSummary } from "@/lib/api";
import { ChatWidget } from "@/features/chatbot/components/chat-widget";
import {
  getNavItems,
  getRoleHome,
  getWorkspaceMeta,
  isNavItemActive,
} from "@/lib/dashboard-nav";

const MESSAGES_REFRESH_INTERVAL_MS = 15_000;

async function loadMessageInbox() {
  const result = await messagingApi.getInbox();
  if (!result.data) throw new Error(result.error ?? "Could not load messages");
  return result.data;
}

const ROLE_GUARDS: Array<{ prefix: string; allowedRoles: string[] }> = [
  { prefix: "/admin", allowedRoles: ["admin"] },
  { prefix: "/doctor", allowedRoles: ["doctor"] },
  { prefix: "/national", allowedRoles: ["national_admin", "admin"] },
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
  const roles = user?.roles ?? [];
  const canAccessMessages = (roles.includes("doctor") && !roles.some((role) => ["admin", "national_admin"].includes(role)))
    || (roles.some((role) => ["user", "patient"].includes(role)) && !roles.some((role) => ["admin", "doctor", "national_admin"].includes(role)));
  const { data: messageInbox = [] } = useSWR<PatientDoctorConversationSummary[]>(
    isAuthenticated && canAccessMessages ? "patient-doctor-inbox" : null,
    loadMessageInbox,
    {
      refreshInterval: MESSAGES_REFRESH_INTERVAL_MS,
      isPaused: () => typeof document !== "undefined" && document.hidden,
      revalidateOnFocus: true,
    },
  );
  const unreadMessageCount = messageInbox.reduce((total, conversation) => total + conversation.unread_count, 0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!isLoading && isAuthenticated && user) {
      for (const guard of ROLE_GUARDS) {
        if (pathname.startsWith(guard.prefix) && !guard.allowedRoles.some((role) => user.roles.includes(role))) {
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

  const navItems = getNavItems(roles);
  const workspace = getWorkspaceMeta(roles);
  const WorkspaceIcon = workspace.icon;

  return (
    <div className="flex h-dvh overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label={`${workspace.label} workspace`}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex h-16 items-center gap-2 px-6 border-b">
            <WorkspaceIcon className="h-8 w-8 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold leading-tight">Health Project</p>
              <p className="truncate text-xs font-medium text-muted-foreground">{workspace.label}</p>
            </div>
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={false}
                  onClick={() => setSidebarOpen(false)}
                  aria-label={item.href === "/messages" && unreadMessageCount > 0
                    ? `Messages, ${unreadMessageCount} unread`
                    : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="flex-1">{item.name}</span>
                  {item.href === "/messages" && unreadMessageCount > 0 && (
                    <span
                      aria-hidden="true"
                      className="inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[11px] font-semibold leading-none text-destructive-foreground"
                    >
                      {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                    </span>
                  )}
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

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col lg:ml-64">
        <header className="h-16 shrink-0 border-b bg-card flex items-center px-4 lg:px-6">
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

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 lg:p-6 bg-background">
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
