import React from "react";
import moment from "moment";
import { Link } from "react-router-dom";
import { Menu, Moon, Sun, FilePlus2, Settings2, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/theme";
import { initials } from "@/lib/constants";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function Topbar({ onMenu, isAdmin }) {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="no-print sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="outline" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open navigation">
            <Menu className="h-4 w-4" />
          </Button>
          <div className="hidden sm:block">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Student Incident Reporting</p>
            <p className="text-[13px] font-semibold text-foreground">{moment().format("dddd, MMMM D, YYYY")}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Link to="/incidents/new">
            <Button size="sm" className="gap-1.5">
              <FilePlus2 className="h-4 w-4" />
              <span className="hidden sm:inline">Record incident</span>
            </Button>
          </Link>
          {isAdmin && <NotificationBell />}
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-inset ring-primary/20 transition hover:bg-primary/15"
              >
                {initials(user?.full_name || user?.email)}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="space-y-0.5">
                <p className="truncate text-sm font-semibold">{user?.full_name || "Signed in"}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
                <p className="pt-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {isAdmin ? "Guidance Counselor · Admin" : "Teacher"}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="gap-2">
                  <Settings2 className="h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                {isAdmin ? (
                  <Link to="/users" className="gap-2">
                    <ShieldCheck className="h-4 w-4" /> User Management
                  </Link>
                ) : (
                  <Link to="/settings" className="gap-2">
                    <UserRound className="h-4 w-4" /> My account
                  </Link>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive" onClick={() => logout()}>
                <LogOut className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}