import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FilePlus2, Pencil } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import StudentFormDialog from "@/components/students/StudentFormDialog";
import StatusBadge from "@/components/incidents/StatusBadge";
import SeverityBadge from "@/components/incidents/SeverityBadge";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

export default function StudentDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [student, setStudent] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const record = await base44.entities.Student.get(id);
      const page = await base44.entities.IncidentReport.filter(
        { student_id: id },
        { sort: "-incident_date", limit: 100 }
      );
      if (cancelled) return;
      setStudent(record);
      setIncidents(page.items || []);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="surface h-64 animate-pulse" />;
  }

  const open = incidents.filter((item) => item.status === "Open" || item.status === "Under Investigation").length;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/students" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to students
        </Link>
      </div>

      <PageHeader
        eyebrow={`${student.department} · ${student.grade_level || "Grade not set"}`}
        title={student.full_name}
        description={`Student ID ${student.student_id}${student.section ? ` · Section ${student.section}` : ""}`}
      >
        <Button variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" /> Edit profile
        </Button>
        <Link to={`/incidents/new?student=${student.id}`}>
          <Button className="gap-2">
            <FilePlus2 className="h-4 w-4" /> Record incident
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="surface p-5 lg:col-span-2">
          <h2 className="font-display text-lg text-foreground">Student profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Detail label="Student ID" value={student.student_id} />
            <Detail label="Enrollment status" value={student.status || "Active"} />
            <Detail label="Department" value={student.department} />
            <Detail label="Grade / Year level" value={student.grade_level} />
            <Detail label="Section" value={student.section} />
            <Detail label="Gender" value={student.gender} />
            <Detail label="Parent / guardian" value={student.guardian_name} />
            <Detail label="Guardian contact" value={student.guardian_contact} />
            <Detail label="Address" value={student.address} />
          </div>
          {student.notes && (
            <div className="mt-4 rounded-xl bg-secondary/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Notes</p>
              <p className="mt-1 text-xs leading-relaxed text-foreground">{student.notes}</p>
            </div>
          )}
        </section>

        <section className="surface p-5">
          <h2 className="font-display text-lg text-foreground">Case summary</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-baseline justify-between border-b border-border/60 pb-2">
              <span className="text-xs text-muted-foreground">Total incident reports</span>
              <span className="font-display text-2xl text-foreground">{incidents.length}</span>
            </div>
            <div className="flex items-baseline justify-between border-b border-border/60 pb-2">
              <span className="text-xs text-muted-foreground">Open / under investigation</span>
              <span className="font-display text-2xl text-amber-600 dark:text-amber-400">{open}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Resolved / closed</span>
              <span className="font-display text-2xl text-emerald-600 dark:text-emerald-400">
                {incidents.length - open}
              </span>
            </div>
          </div>
        </section>
      </div>

      <section className="surface overflow-hidden">
        <div className="border-b border-border/70 px-5 py-4">
          <h2 className="font-display text-lg text-foreground">Incident history</h2>
          <p className="text-xs text-muted-foreground">Every case filed for this student, most recent first</p>
        </div>

        {incidents.length === 0 ? (
          <p className="px-5 py-12 text-center text-xs text-muted-foreground">
            No incident reports recorded for this student.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {incidents.map((incident) => (
              <li key={incident.id}>
                <Link to={`/incidents/${incident.id}`} className="block px-5 py-4 transition-colors hover:bg-secondary/50">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-primary">{incident.case_number}</span>
                    <span className="text-xs text-muted-foreground">{fmtDate(incident.incident_date)}</span>
                    <StatusBadge status={incident.status} />
                    <SeverityBadge severity={incident.severity} />
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-foreground">{incident.category}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{incident.description}</p>
                  {incident.action_taken && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground/80">Action taken:</span> {incident.action_taken}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <StudentFormDialog
        student={student}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={(saved) => {
          setStudent(saved);
          toast({ title: "Student record updated", description: saved.full_name });
        }}
      />
    </div>
  );
}