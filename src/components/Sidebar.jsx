import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FolderOpen,
  FilePlus2,
  BarChart3,
  Settings2,
  LogOut,
  BookOpenCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { useAccess } from "@/lib/useAccess";
import { useSchoolSettings } from "@/lib/useSchoolSettings";
import { initials } from "@/lib/constants";

const GROUPS = [
  { label: "Overview", items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }] },
  {
    label: "Case management",
    items: [
      { to: "/incidents/new", label: "Record an Incident", icon: FilePlus2 },
      { to: "/incidents", label: "Incident Records", icon: FolderOpen, end: true },
    ],
  },
  { label: "Student records", items: [{ to: "/students", label: "Students", icon: GraduationCap }] },
  { label: "Insights", items: [{ to: "/reports", label: "Reports & Analytics", icon: BarChart3 }] },
  {
    label: "Administration",
    items: [
      { to: "/users", label: "User Management", icon: Users, adminOnly: true },
      { to: "/settings", label: "Settings", icon: Settings2 },
    ],
  },
];

export default function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const { isAdmin, profile } = useAccess();
  const { settings } = useSchoolSettings();

  return (
    <div className="flex h-full flex-col border-r border-border/70 bg-card">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <BookOpenCheck className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] leading-tight text-foreground">
            {settings?.school_name || "Student Incidents"}
          </p>
          <p className="truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Guidance Office
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {GROUPS.map((group) => {
          const items = group.items.filter((item) => !item.adminOnly || isAdmin);
          if (!items.length) return null;
          return (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-opacity",
                              isActive ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.9} />
                          <span className="truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border/70 p-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-secondary/60 p-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {initials(user?.full_name || user?.email)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">{user?.full_name || user?.email}</p>
            <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
              {isAdmin ? "Guidance Counselor" : profile?.position || "Teacher"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            title="Sign out"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}