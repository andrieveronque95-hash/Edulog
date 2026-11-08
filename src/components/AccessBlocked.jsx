import React from "react";
import { LogOut, ShieldAlert, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

export default function AccessBlocked({ profile }) {
  const { user, logout } = useAuth();
  const pending = profile && profile.active === false;

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="surface w-full max-w-md p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          {pending ? <Clock className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
        </span>
        <h1 className="mt-5 font-display text-2xl text-foreground">
          {pending ? "Account deactivated" : "Account not authorized"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {pending
            ? "Your staff account has been deactivated. Please contact the Guidance Office to restore access."
            : "Teacher accounts are created by the Guidance Office. Your sign-in is not linked to a staff profile yet — please request an invitation from the administrator."}
        </p>
        <p className="mt-4 rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
          Signed in as {user?.email}
        </p>
        <Button className="mt-6 w-full gap-2" variant="outline" onClick={() => logout()}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}