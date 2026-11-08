import React, { useEffect, useState } from "react";
import { CheckCircle2, Mail, Send, ShieldAlert, XCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SendParentEmailDialog from "@/components/incidents/SendParentEmailDialog";
import { fmtDateTime, isHighAlert } from "@/lib/constants";

export default function ParentNotificationCard({ report, isAdmin }) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const highAlert = isHighAlert(report.severity);
  const lastSent = notifications.find((item) => item.status === "Sent");
  const lastAttempt = notifications[0];

  useEffect(() => {
    if (!isAdmin || !highAlert) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      const [notes, person] = await Promise.all([
        base44.entities.ParentNotification.filter({ incident_id: report.id }, { sort: "-created_date", limit: 20 }),
        report.student_id
          ? base44.entities.Student.get(report.student_id).catch(() => null)
          : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setNotifications(notes.items || []);
      setStudent(person);
      setLoading(false);
    }
    load().catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, highAlert, report.id, report.student_id]);

  if (!isAdmin) return null;

  const handleSent = (result) => {
    if (result?.notification) setNotifications((current) => [result.notification, ...current]);
    if (result && result.delivered === false) {
      toast({
        title: "Email could not be delivered",
        description: result.error || "Check the guardian's email address and try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-foreground">Parent notification</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Guidance counselor only · used for emergency and high-alert cases.
            </p>
          </div>
          {highAlert && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-300">
              <ShieldAlert className="h-3 w-3" /> High alert
            </span>
          )}
        </div>

        {!highAlert && (
          <p className="mt-3 rounded-xl bg-secondary/60 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
            This case is filed as {report.severity || "unrated"} severity, so parents are not emailed. Parent
            notifications are sent only for High or Critical incidents — raise the severity from Edit if this case is an
            emergency.
          </p>
        )}

        {highAlert && loading && <div className="mt-4 h-16 animate-pulse rounded-xl bg-secondary" />}

        {highAlert && !loading && (
          <>
            {lastSent ? (
              <div className="mt-4 rounded-xl border border-emerald-300/60 bg-emerald-50 px-3.5 py-3 dark:border-emerald-500/25 dark:bg-emerald-500/10">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" /> Parents notified
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {lastSent.recipient_email} · {fmtDateTime(lastSent.sent_at || lastSent.created_date)}
                </p>
              </div>
            ) : lastAttempt && lastAttempt.status === "Failed" ? (
              <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                  <XCircle className="h-4 w-4" /> Last attempt failed
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{lastAttempt.error || "Delivery failed."}</p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-amber-300/70 bg-amber-50 px-3.5 py-3 dark:border-amber-500/25 dark:bg-amber-500/10">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">Parents have not been emailed yet</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  High-alert cases should reach the family as soon as possible.
                </p>
              </div>
            )}

            <Button className="mt-3 w-full gap-2" onClick={() => setDialogOpen(true)}>
              {lastSent ? <Send className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
              {lastSent ? "Resend email to parents" : "Send Email to Parents"}
            </Button>

            {notifications.length > 0 && (
              <div className="mt-4">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Notification history
                </h3>
                <ul className="mt-2 space-y-2">
                  {notifications.map((entry) => (
                    <li key={entry.id} className="rounded-lg border border-border/70 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-medium text-foreground">{entry.recipient_email}</span>
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ring-1 ring-inset ${
                            entry.status === "Sent"
                              ? "bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/15 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-700 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-300"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {fmtDateTime(entry.sent_at || entry.created_date)} · {entry.sender_name || entry.sender_email}
                        {entry.is_resend ? " · resend" : ""}
                        {entry.attachments_sent ? ` · ${entry.attachments_sent}` : ""}
                      </p>
                      {entry.status === "Failed" && entry.error && (
                        <p className="mt-1 text-[10px] text-destructive">{entry.error}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </Card>

      <SendParentEmailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        report={report}
        student={student}
        lastSent={lastSent}
        onSent={handleSent}
      />
    </>
  );
}