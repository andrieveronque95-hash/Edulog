import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import DepartmentFilter from "@/components/dashboard/DepartmentFilter";
import StatCard from "@/components/dashboard/StatCard";
import TrendChart from "@/components/dashboard/TrendChart";
import CategoryBars from "@/components/dashboard/CategoryBars";
import SeverityDonut from "@/components/dashboard/SeverityDonut";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadCsv } from "@/lib/csv";
import { DEPARTMENTS, SEVERITIES, SEVERITY_HEX, STATUSES, STATUS_HEX, fmtDate } from "@/lib/constants";

const CATEGORY_COLORS = ["#4f46e5", "#0ea5e9", "#14b8a6", "#f59e0b", "#e11d48", "#8b5cf6", "#64748b"];

export default function Reports() {
  const [department, setDepartment] = useState("all");
  const [from, setFrom] = useState(moment().startOf("year").format("YYYY-MM-DD"));
  const [to, setTo] = useState(moment().format("YYYY-MM-DD"));
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const query = {};
      if (department !== "all") query.department = department;
      if (from || to) {
        query.incident_date = {};
        if (from) query.incident_date.$gte = from;
        if (to) query.incident_date.$lte = to;
      }
      const page = await base44.entities.IncidentReport.filter(query, { sort: "-incident_date", limit: 1000 });
      if (cancelled) return;
      setIncidents(page.items || []);
      setLoading(false);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [department, from, to]);

  const summary = useMemo(() => {
    const byStatus = STATUSES.reduce((acc, status) => {
      acc[status] = incidents.filter((item) => item.status === status).length;
      return acc;
    }, {});

    const byDepartment = DEPARTMENTS.filter((dept) => department === "all" || dept === department).map((dept) => {
      const rows = incidents.filter((item) => item.department === dept);
      return {
        department: dept,
        total: rows.length,
        open: rows.filter((item) => item.status === "Open").length,
        investigating: rows.filter((item) => item.status === "Under Investigation").length,
        resolved: rows.filter((item) => item.status === "Resolved").length,
        closed: rows.filter((item) => item.status === "Closed").length,
      };
    });

    const categoryMap = new Map();
    incidents.forEach((item) => {
      const key = item.category || "Uncategorised";
      categoryMap.set(key, (categoryMap.get(key) || 0) + 1);
    });
    const byCategory = [...categoryMap.entries()]
      .map(([name, value], index) => ({ name, value, color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }))
      .sort((a, b) => b.value - a.value);

    const bySeverity = SEVERITIES.map((severity) => ({
      name: severity,
      value: incidents.filter((item) => item.severity === severity).length,
      color: SEVERITY_HEX[severity],
    }));

    const start = moment(from || to || undefined).startOf("month");
    const end = moment(to || from || undefined).endOf("month");
    const buckets = [];
    const cursor = start.clone();
    while (cursor.isSameOrBefore(end, "month") && buckets.length < 18) {
      buckets.push({ key: cursor.format("YYYY-MM"), label: cursor.format("MMM YY"), total: 0 });
      cursor.add(1, "month");
    }
    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    incidents.forEach((item) => {
      if (!item.incident_date) return;
      const bucket = bucketMap.get(moment(item.incident_date).format("YYYY-MM"));
      if (bucket) bucket.total += 1;
    });

    const studentMap = new Map();
    incidents.forEach((item) => {
      const key = item.student_id || item.student_name;
      const entry =
        studentMap.get(key) || { id: item.student_id, name: item.student_name, department: item.department, total: 0, open: 0, last: item.incident_date };
      entry.total += 1;
      if (item.status === "Open" || item.status === "Under Investigation") entry.open += 1;
      if (item.incident_date && (!entry.last || item.incident_date > entry.last)) entry.last = item.incident_date;
      studentMap.set(key, entry);
    });

    return {
      byStatus,
      byDepartment,
      byCategory,
      bySeverity,
      trend: buckets,
      students: [...studentMap.values()].sort((a, b) => b.total - a.total).slice(0, 12),
    };
  }, [incidents, department, from, to]);

  const exportCases = () => {
    downloadCsv(`incident-cases-${from || "all"}-to-${to || "all"}.csv`, [
      [
        "Case Number",
        "Student",
        "Student ID",
        "Department",
        "Grade Level",
        "Section",
        "Incident Date",
        "Time",
        "Location",
        "Category",
        "Severity",
        "Status",
        "Reported By",
        "Action Taken",
      ],
      ...incidents.map((item) => [
        item.case_number,
        item.student_name,
        item.student_number,
        item.department,
        item.grade_level,
        item.section,
        item.incident_date,
        item.incident_time,
        item.location,
        item.category,
        item.severity,
        item.status,
        item.reported_by_name,
        item.action_taken,
      ]),
    ]);
  };

  const exportSummary = () => {
    const rows = [["Summary by department"], ["Department", "Total", "Open", "Under Investigation", "Resolved", "Closed"]];
    summary.byDepartment.forEach((row) =>
      rows.push([row.department, row.total, row.open, row.investigating, row.resolved, row.closed])
    );
    rows.push([], ["Summary by category"], ["Category", "Cases"]);
    summary.byCategory.forEach((row) => rows.push([row.name, row.value]));
    rows.push([], ["Summary by severity"], ["Severity", "Cases"]);
    summary.bySeverity.forEach((row) => rows.push([row.name, row.value]));
    rows.push([], ["Summary by status"], ["Status", "Cases"]);
    STATUSES.forEach((status) => rows.push([status, summary.byStatus[status]]));
    downloadCsv(`incident-summary-${from || "all"}-to-${to || "all"}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Reports & analytics"
        description="Summaries of incidents by department, category, severity, status and date. Export the data or print the report."
      >
        <Button variant="outline" className="gap-2" onClick={exportSummary} disabled={loading}>
          <FileSpreadsheet className="h-4 w-4" /> Summary CSV
        </Button>
        <Button variant="outline" className="gap-2" onClick={exportCases} disabled={loading}>
          <Download className="h-4 w-4" /> Cases CSV
        </Button>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print
        </Button>
      </PageHeader>

      <div className="no-print space-y-3">
        <DepartmentFilter value={department} onChange={setDepartment} />
        <div className="surface flex flex-wrap items-end gap-3 p-4">
          <div>
            <Label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              From
            </Label>
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="w-40" />
          </div>
          <div>
            <Label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              To
            </Label>
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="w-40" />
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            {loading ? "Crunching numbers…" : `${incidents.length} case${incidents.length === 1 ? "" : "s"} in range`}
          </div>
        </div>
      </div>

      <div className="print-report space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total cases" value={incidents.length} tone="primary" />
          <StatCard label="Open" value={summary.byStatus.Open} tone="amber" />
          <StatCard label="Under investigation" value={summary.byStatus["Under Investigation"]} tone="sky" />
          <StatCard label="Resolved" value={summary.byStatus.Resolved} tone="emerald" />
          <StatCard label="Closed" value={summary.byStatus.Closed} tone="slate" />
        </div>

        <section className="surface p-5">
          <h2 className="font-display text-lg text-foreground">Incident trend</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            {fmtDate(from)} — {fmtDate(to)}
          </p>
          <TrendChart data={summary.trend} height={230} />
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="surface p-5">
            <h2 className="mb-4 font-display text-lg text-foreground">Cases by category</h2>
            <CategoryBars data={summary.byCategory} />
          </section>
          <section className="surface p-5">
            <h2 className="mb-4 font-display text-lg text-foreground">Cases by severity</h2>
            <SeverityDonut data={summary.bySeverity} />
          </section>
        </div>

        <section className="surface overflow-hidden">
          <div className="border-b border-border/70 px-5 py-4">
            <h2 className="font-display text-lg text-foreground">Comparison by department</h2>
            <p className="text-xs text-muted-foreground">Open, under investigation, resolved and closed cases</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                  <TableHead>Department</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Open</TableHead>
                  <TableHead>Under investigation</TableHead>
                  <TableHead>Resolved</TableHead>
                  <TableHead>Closed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.byDepartment.map((row) => (
                  <TableRow key={row.department}>
                    <TableCell className="text-sm font-medium">{row.department}</TableCell>
                    <TableCell className="text-sm">{row.total}</TableCell>
                    <TableCell className="text-sm text-amber-600 dark:text-amber-400">{row.open}</TableCell>
                    <TableCell className="text-sm text-sky-600 dark:text-sky-400">{row.investigating}</TableCell>
                    <TableCell className="text-sm text-emerald-600 dark:text-emerald-400">{row.resolved}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.closed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="surface overflow-hidden">
            <div className="border-b border-border/70 px-5 py-4">
              <h2 className="font-display text-lg text-foreground">Status comparison</h2>
              <p className="text-xs text-muted-foreground">Share of cases per status</p>
            </div>
            <ul className="divide-y divide-border/60">
              {STATUSES.map((status) => {
                const count = summary.byStatus[status] || 0;
                const share = incidents.length ? Math.round((count / incidents.length) * 100) : 0;
                return (
                  <li key={status} className="px-5 py-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{status}</span>
                      <span className="text-muted-foreground">
                        {count} · {share}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${share}%`, background: STATUS_HEX[status] }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="surface overflow-hidden">
            <div className="border-b border-border/70 px-5 py-4">
              <h2 className="font-display text-lg text-foreground">Student incident history</h2>
              <p className="text-xs text-muted-foreground">Students with the most cases in this range</p>
            </div>
            {summary.students.length === 0 ? (
              <p className="px-5 py-10 text-center text-xs text-muted-foreground">No cases in this range.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {summary.students.map((student) => (
                  <li key={`${student.id}-${student.name}`} className="flex items-center justify-between gap-3 px-5 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{student.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {student.department} · last case {fmtDate(student.last)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-foreground">{student.total}</p>
                      <p className="text-[10px] text-muted-foreground">{student.open} active</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}