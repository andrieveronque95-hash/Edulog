import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  FolderOpen,
  GraduationCap,
  Search,
  ShieldAlert,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import DepartmentFilter from "@/components/dashboard/DepartmentFilter";
import TrendChart from "@/components/dashboard/TrendChart";
import SeverityDonut from "@/components/dashboard/SeverityDonut";
import CategoryBars from "@/components/dashboard/CategoryBars";
import HighAlertPanel from "@/components/dashboard/HighAlertPanel";
import StatusBadge from "@/components/incidents/StatusBadge";
import SeverityBadge from "@/components/incidents/SeverityBadge";
import { Button } from "@/components/ui/button";
import { SEVERITIES, SEVERITY_HEX, fmtDate, firstName, monthsBack } from "@/lib/constants";

const CATEGORY_COLORS = ["#4f46e5", "#0ea5e9", "#14b8a6", "#f59e0b", "#e11d48", "#8b5cf6", "#64748b"];

export default function Dashboard() {
  const { user } = useAuth();
  const [department, setDepartment] = useState("all");
  const [data, setData] = useState({ loading: true });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setData((current) => ({ ...current, loading: true }));
      const base = department === "all" ? {} : { department };
      const [students, total, open, investigating, resolved, closed, records] = await Promise.all([
        base44.entities.Student.count(base),
        base44.entities.IncidentReport.count(base),
        base44.entities.IncidentReport.count({ ...base, status: "Open" }),
        base44.entities.IncidentReport.count({ ...base, status: "Under Investigation" }),
        base44.entities.IncidentReport.count({ ...base, status: "Resolved" }),
        base44.entities.IncidentReport.count({ ...base, status: "Closed" }),
        base44.entities.IncidentReport.filter(base, { sort: "-incident_date", limit: 300 }),
      ]);
      if (cancelled) return;

      const items = records.items || [];
      const categoryMap = new Map();
      items.forEach((item) => {
        const key = item.category || "Uncategorised";
        categoryMap.set(key, (categoryMap.get(key) || 0) + 1);
      });
      const categoryData = [...categoryMap.entries()]
        .map(([name, value], index) => ({ name, value, color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      const severityData = SEVERITIES.map((severity) => ({
        name: severity,
        value: items.filter((item) => item.severity === severity).length,
        color: SEVERITY_HEX[severity],
      }));

      const trend = monthsBack(6).map((month) => ({
        label: month.format("MMM"),
        total: items.filter((item) => item.incident_date && moment(item.incident_date).isSame(month, "month"))
          .length,
      }));

      setData({
        loading: false,
        students,
        total,
        open,
        investigating,
        resolved,
        closed,
        recent: items.slice(0, 6),
        categoryData,
        severityData,
        trend,
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [department]);

  const value = (number) => (data.loading ? "…" : number ?? 0);
  const greeting = moment().hour() < 12 ? "Good morning" : moment().hour() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${greeting}, ${firstName(user?.full_name || "there")}`}
        title="Incident overview"
        description="Monitor student discipline cases across departments, review recent reports and track how each case is progressing."
      >
        <Link to="/incidents/new">
          <Button className="gap-2">
            Record an incident <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </PageHeader>

      <DepartmentFilter value={department} onChange={setDepartment} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Students" value={value(data.students)} icon={GraduationCap} tone="primary" hint="Enrolled student records" />
        <StatCard label="Total reports" value={value(data.total)} icon={FolderOpen} tone="slate" hint="All recorded incidents" />
        <StatCard label="Open cases" value={value(data.open)} icon={ShieldAlert} tone="amber" hint="Awaiting action" />
        <StatCard label="Under investigation" value={value(data.investigating)} icon={Search} tone="sky" hint="Being reviewed" />
        <StatCard label="Resolved" value={value(data.resolved)} icon={CheckCircle2} tone="emerald" hint="Action completed" />
        <StatCard label="Closed" value={value(data.closed)} icon={Archive} tone="slate" hint="Archived cases" />
      </div>

      {user?.role === "admin" && <HighAlertPanel />}

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="surface p-5 xl:col-span-2">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg text-foreground">Incident trend</h2>
              <p className="text-xs text-muted-foreground">Recorded cases over the last six months</p>
            </div>
          </div>
          <TrendChart data={data.trend || []} />
        </section>

        <section className="surface p-5">
          <div className="mb-4">
            <h2 className="font-display text-lg text-foreground">Severity distribution</h2>
            <p className="text-xs text-muted-foreground">How serious the recorded cases are</p>
          </div>
          <SeverityDonut data={data.severityData || []} />
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="surface p-5">
          <div className="mb-4">
            <h2 className="font-display text-lg text-foreground">Category distribution</h2>
            <p className="text-xs text-muted-foreground">Most frequent incident categories</p>
          </div>
          <CategoryBars data={data.categoryData || []} />
        </section>

        <section className="surface overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
            <div>
              <h2 className="font-display text-lg text-foreground">Recent incident reports</h2>
              <p className="text-xs text-muted-foreground">Latest cases filed by teachers</p>
            </div>
            <Link to="/incidents" className="text-xs font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>

          {data.loading && <p className="px-5 py-10 text-center text-xs text-muted-foreground">Loading reports…</p>}
          {!data.loading && (data.recent || []).length === 0 && (
            <p className="px-5 py-10 text-center text-xs text-muted-foreground">
              No incidents recorded for this selection.
            </p>
          )}

          <ul className="divide-y divide-border/60">
            {(data.recent || []).map((incident) => (
              <li key={incident.id}>
                <Link
                  to={`/incidents/${incident.id}`}
                  className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-secondary/50"
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
                    <StatusBadge status={incident.status} />
                    <SeverityBadge severity={incident.severity} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}