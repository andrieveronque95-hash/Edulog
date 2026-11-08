import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BellRing, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SeverityBadge from "@/components/incidents/SeverityBadge";
import { fmtDate } from "@/lib/constants";

const HIGH_ALERT = ["High", "Critical"];

export default function HighAlertPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { items: reports } = await base44.entities.IncidentReport.filter(
        { severity: { $in: HIGH_ALERT } },
        { sort: "-incident_date", limit: 20 }
      );
      const ids = reports.map((report) => report.id);
      const notes = ids.length
        ? await base44.entities.ParentNotification.filter({ incident_id: { $in: ids } }, { limit: 100 })
        : { items: [] };
      if (cancelled) return;
      const notified = new Set(
        (notes.items || []).filter((note) => note.status === "Sent").map((note) => note.incident_id)
      );
      setItems(reports.map((report) => ({ ...report, notified: notified.has(report.id) })));
      setLoading(false);
    }
    load().catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pending = items.filter((item) => !item.notified);

  return (
    <section className="surface overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg text-foreground">
            <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" /> High-alert incidents
          </h2>
          <p className="text-xs text-muted-foreground">
            Emergency cases where the family should be emailed · guidance counselor only
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-rose-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
          {pending.length} to notify
        </span>
      </div>

      {loading && <p className="px-5 py-8 text-center text-xs text-muted-foreground">Loading high-alert cases…</p>}

      {!loading && items.length === 0 && (
        <p className="px-5 py-8 text-center text-xs text-muted-foreground">
          No High or Critical incidents recorded. Routine cases never trigger parent emails.
        </p>
      )}

      <ul className="divide-y divide-border/60">
        {items.map((incident) => (
          <li key={incident.id}>
            <Link
              to={`/incidents/${incident.id}`}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-primary">{incident.case_number}</span>
                  <span className="truncate text-sm font-medium text-foreground">{incident.student_name}</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {incident.category} · {fmtDate(incident.incident_date)} · {incident.department}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <SeverityBadge severity={incident.severity} />
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                    incident.notified
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  <BellRing className="h-3 w-3" /> {incident.notified ? "Parents notified" : "Not notified"}
                </span>
              </div>
              <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}