import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import AccessBlocked from "@/components/AccessBlocked";
import { useAccess } from "@/lib/useAccess";

export default function Layout() {
  const { loading, allowed, isAdmin, profile } = useAccess();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  if (!allowed) return <AccessBlocked profile={profile} />;

  return (
    <div className="min-h-screen bg-background">
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:block">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[276px] shadow-2xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="print-full lg:pl-[264px]">
        <Topbar onMenu={() => setMobileOpen(true)} isAdmin={isAdmin} />
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}