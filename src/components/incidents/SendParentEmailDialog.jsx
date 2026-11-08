import React, { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Mail, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isHighAlert, fmtDateTime, fmtDate, fmtTime } from "@/lib/constants";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

export default function SendParentEmailDialog({ open, onOpenChange, report, student, lastSent, onSent }) {
  const { toast } = useToast();
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    const contact = student?.guardian_contact || "";
    setRecipientName(student?.guardian_name || "");
    setRecipientEmail(student?.guardian_email || (EMAIL_RE.test(contact.trim()) ? contact.trim() : ""));
  }, [open, student]);

  const submit = async () => {
    const email = recipientEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return setError("Enter a valid parent or guardian email address.");
    setSending(true);
    setError("");
    try {
      const response = await base44.functions.invoke("sendParentNotification", {
        incident_id: report.id,
        recipient_email: email,
        recipient_name: recipientName.trim(),
        resend: Boolean(lastSent),
      });
      onSent(response.data);
      if (response.data && response.data.delivered === false) {
        setError(response.data.error || "The email could not be delivered. Check the guardian's address and try again.");
        return;
      }
      if (response.data?.delivered) {
        toast({
          title: lastSent ? "Reminder email sent" : "Parent notified",
          description: `${email} received the ${report.severity.toLowerCase()}-alert notice for ${report.case_number}.`,
        });
        onOpenChange(false);
      }
    } catch (sendError) {
      setError(
        sendError?.response?.data?.error || sendError?.message || "The notification could not be sent. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lastSent ? "Resend parent email" : "Send email to parents"}</DialogTitle>
          <DialogDescription>
            The parent or guardian receives the incident details, the urgency level and your school's contact
            information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div
            className={`rounded-xl border px-3.5 py-3 ${
              report.severity === "Critical"
                ? "border-rose-300/70 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10"
                : "border-orange-300/70 bg-orange-50 dark:border-orange-500/30 dark:bg-orange-500/10"
            }`}
          >
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-foreground">
              <ShieldAlert className="h-3.5 w-3.5" /> {report.severity} alert · {report.case_number}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {report.student_name} · {fmtDate(report.incident_date)} at {fmtTime(report.incident_time)} ·{" "}
              {report.category}
            </p>
          </div>

          <div>
            <Label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Parent / guardian name
            </Label>
            <Input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} placeholder="Parent or guardian" />
          </div>
          <div>
            <Label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Parent / guardian email
            </Label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
              placeholder="parent@example.com"
            />
            {student && !student.guardian_email && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                No guardian email is saved on the student record — type it here, or add it in Students so future
                notifications are pre-filled.
              </p>
            )}
          </div>

          {lastSent && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-300/70 bg-amber-50 px-3.5 py-3 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-xs leading-relaxed">
                Parents were already emailed about this case on {fmtDateTime(lastSent.sent_at || lastSent.created_date)}{" "}
                ({lastSent.recipient_email}). Sending again emails them a second time — choose <strong>Resend email</strong>{" "}
                only if you intend to.
              </p>
            </div>
          )}

          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button className="gap-2" onClick={submit} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {lastSent ? "Resend email" : "Send email to parent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}