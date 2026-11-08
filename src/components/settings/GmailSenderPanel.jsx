import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Copy, RefreshCw } from "lucide-react";
import GmailSenderHistory from "@/components/settings/GmailSenderHistory";

const RECONNECT_REQUEST = "Please reconnect my Gmail sender account for parent notifications";

export default function GmailSenderPanel() {
  const { toast } = useToast();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke("gmailSenderStatus", {});
      setStatus(response.data || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const copyRequest = async () => {
    await navigator.clipboard.writeText(RECONNECT_REQUEST);
    toast({
      title: "Request copied",
      description: "Paste it into the Base44 chat to authorize a different Gmail account.",
    });
  };

  const healthy = status?.connected && status?.canSend;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-secondary/40 p-4">
        {loading ? (
          <div className="h-14 animate-pulse rounded-lg bg-secondary" />
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                {healthy ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {healthy ? "Connected and ready to send" : "Reconnect needed"}
                  </p>
                  <p className="break-all text-xs text-muted-foreground">
                    {status?.senderEmail || status?.error || "No Gmail account is connected."}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={load} disabled={loading} aria-label="Recheck connection">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <dl className="mt-3 grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
              <div>
                <dt className="inline">Send permission: </dt>
                <dd className="inline font-medium text-foreground">{status?.canSend ? "Granted" : "Missing"}</dd>
              </div>
              <div>
                <dt className="inline">Last checked: </dt>
                <dd className="inline font-medium text-foreground">
                  {status?.checkedAt ? format(new Date(status.checkedAt), "dd MMM yyyy, HH:mm") : "—"}
                </dd>
              </div>
            </dl>
          </>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-border p-4">
        <p className="text-xs font-medium text-foreground">Changing the sender account</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Gmail is authorized once for the whole app by its owner, so it can't be swapped from inside this screen.
          To switch to a different Gmail account, request a reconnect in the builder chat and approve the Google
          sign-in with the new account. Notification history and the email workflow stay exactly as they are.
        </p>
        <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={copyRequest}>
          <Copy className="h-3.5 w-3.5" /> Copy reconnect request
        </Button>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-foreground">Recent parent notifications</p>
        <GmailSenderHistory />
      </div>
    </div>
  );
}