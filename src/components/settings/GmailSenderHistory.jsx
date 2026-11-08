import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function GmailSenderHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    base44.entities.ParentNotification
      .filter({}, { sort: "-created_date", limit: 5 })
      .then(({ items }) => {
        if (!cancelled) setRows(items || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="h-16 animate-pulse rounded-xl bg-secondary" />;
  if (!rows.length) return <p className="text-xs text-muted-foreground">No parent notifications sent yet.</p>;

  return (
    <ul className="divide-y divide-border/70">
      {rows.map((row) => (
        <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-foreground">
              {row.student_name || "Student"} · {row.case_number || "—"}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">{row.recipient_email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={row.status === "Sent" ? "secondary" : "destructive"}>{row.status}</Badge>
            <span className="text-[11px] text-muted-foreground">
              {row.sent_at ? format(new Date(row.sent_at), "dd MMM, HH:mm") : "—"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}