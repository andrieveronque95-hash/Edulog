import React from "react";
import { LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useAccess } from "@/lib/useAccess";
import { useTheme } from "@/lib/theme";
import { useSchoolSettings } from "@/lib/useSchoolSettings";
import PageHeader from "@/components/PageHeader";
import SchoolProfileForm from "@/components/settings/SchoolProfileForm";
import CategoryManager from "@/components/settings/CategoryManager";
import GmailSenderPanel from "@/components/settings/GmailSenderPanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Settings() {
  const { user, logout } = useAuth();
  const { isAdmin, profile } = useAccess();
  const { theme, toggle } = useTheme();
  const { settings, recordId, loading, setSettings } = useSchoolSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Settings"
        description="School details used on printed reports, incident categories and your account preferences."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <h2 className="font-display text-lg text-foreground">School profile</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            These details appear on every printable incident report.
          </p>
          {loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-secondary" />
          ) : (
            <SchoolProfileForm
              settings={settings}
              recordId={recordId}
              isAdmin={isAdmin}
              onSaved={(saved) => setSettings((current) => ({ ...current, ...saved }))}
            />
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-display text-lg text-foreground">Appearance</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Choose how the workspace looks on this device.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant={theme === "light" ? "default" : "outline"} className="gap-2" onClick={() => theme !== "light" && toggle()}>
                <Sun className="h-4 w-4" /> Light
              </Button>
              <Button variant={theme === "dark" ? "default" : "outline"} className="gap-2" onClick={() => theme !== "dark" && toggle()}>
                <Moon className="h-4 w-4" /> Dark
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-lg text-foreground">Your account</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="truncate font-medium text-foreground">{user?.full_name || "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="truncate font-medium text-foreground">{user?.email}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Role</dt>
                <dd className="font-medium text-foreground">
                  {isAdmin ? "Guidance counselor (admin)" : profile?.position || "Teacher"}
                </dd>
              </div>
            </dl>
            <Button variant="outline" className="mt-4 w-full gap-2" onClick={() => logout()}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </Card>
        </div>
      </div>

      {isAdmin && (
        <Card className="p-5">
          <h2 className="font-display text-lg text-foreground">Gmail sender</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            The account used to email parents and guardians about high-alert incidents.
          </p>
          <GmailSenderPanel />
        </Card>
      )}

      <Card className="p-5">
        <h2 className="font-display text-lg text-foreground">Incident categories</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Categories available when filing a report, each with a default severity.
        </p>
        <CategoryManager isAdmin={isAdmin} />
      </Card>

    </div>
  );
}