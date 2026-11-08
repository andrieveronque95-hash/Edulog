import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import {
  ArrowLeft,
  CalendarClock,
  FilePlus2,
  Loader2,
  MapPin,
  Pencil,
  Printer,
  Save,
  ShieldAlert,
  Trash2,
  User,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/incidents/StatusBadge";
import SeverityBadge from "@/components/incidents/SeverityBadge";
import AttachmentList from "@/components/incidents/AttachmentList";
import AttachmentUploader from "@/components/incidents/AttachmentUploader";
import SignatureManager from "@/components/incidents/SignatureManager";
import SignatureSummary from "@/components/incidents/SignatureSummary";
import EditIncidentDialog from "@/components/incidents/EditIncidentDialog";
import ParentNotificationCard from "@/components/incidents/ParentNotificationCard";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUSES, fmtDate, fmtDateTime, fmtTime, isHighAlert } from "@/lib/constants";

function Block({ title, children }) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</h3>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground">{children || "—"}</p>
    </div>
  );
}

function Meta({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
        <p className="truncate text-sm text-foreground">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [report, setReport] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [history, setHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === "admin";
  const canEdit = isAdmin;

  const load = async () => {
    const record = await base44.entities.IncidentReport.get(id);
    const [files, log, cats] = await Promise.all([
      base44.entities.IncidentAttachment.filter({ incident_id: id }, { sort: "created_date", limit: 30 }),
      base44.entities.IncidentStatusHistory.filter({ incident_id: id }, { sort: "-created_date", limit: 40 }),
      base44.entities.IncidentCategory.list({ sort: "name", limit: 100 }),
    ]);
    setReport(record);
    setNewStatus(record.status);
    setAttachments(files.items || []);
    setHistory(log.items || []);
    setCategories(cats.items || []);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    load().catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const updateStatus = async () => {
    if (!newStatus || newStatus === report.status) return;
    setSavingStatus(true);
    try {
      await base44.entities.IncidentReport.update(report.id, { status: newStatus });
      await base44.entities.IncidentStatusHistory.create({
        incident_id: report.id,
        from_status: report.status,
        to_status: newStatus,
        note: statusNote.trim() || `Status changed to ${newStatus}`,
        changed_by_name: user?.full_name || user?.email,
        changed_at: new Date().toISOString(),
      });
      setStatusNote("");
      await load();
      toast({ title: "Case status updated", description: `${report.case_number} is now ${newStatus}.` });
    } finally {
      setSavingStatus(false);
    }
  };

  const saveSignatures = async (next) => {
    const updated = await base44.entities.IncidentReport.update(report.id, {
      teacher_signature: next.teacher || null,
      guardian_signature: next.guardian || null,
      principal_signature: next.principal || null,
    });
    setReport(updated);
    toast({ title: "Signature saved" });
  };

  const addFiles = async (files) => {
    if (!files.length) return;
    await base44.entities.IncidentAttachment.bulkCreate(
      files.map((file) => ({
        incident_id: report.id,
        file_name: file.file_name,
        file_uri: file.file_uri,
        file_type: file.file_type,
        file_size: file.file_size,
        uploaded_by_name: user?.full_name || user?.email,
      }))
    );
    await base44.entities.IncidentReport.update(report.id, {
      attachment_count: (report.attachment_count || 0) + files.length,
    });
    await load();
    toast({ title: "Document attached" });
  };

  const removeFile = async (file) => {
    await base44.entities.IncidentAttachment.delete(file.id);
    await base44.entities.IncidentReport.update(report.id, {
      attachment_count: Math.max(0, (report.attachment_count || 1) - 1),
    });
    await load();
    toast({ title: "Document removed" });
  };

  const deleteReport = async () => {
    setDeleting(true);
    try {
      await base44.entities.IncidentAttachment.deleteMany({ incident_id: report.id });
      await base44.entities.IncidentStatusHistory.deleteMany({ incident_id: report.id });
      await base44.entities.Notification.deleteMany({ incident_id: report.id });
      await base44.entities.IncidentReport.delete(report.id);
      toast({ title: "Incident deleted", description: `Case ${report.case_number} was removed.` });
      navigate("/incidents");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) return <div className="surface h-72 animate-pulse" />;
  if (!report) return <p className="text-sm text-muted-foreground">This incident record could not be found.</p>;

  const isOwner =
    report.created_by_id === user?.id || (Boolean(report.reported_by_email) && report.reported_by_email === user?.email);

  if (!isAdmin && !isOwner) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-foreground">This case is not part of the reports you submitted.</p>
        <Link to="/incidents" className="text-xs font-medium text-primary hover:underline">
          Back to my incident records
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/incidents"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to incident records
      </Link>

      <PageHeader
        eyebrow={`Case ${report.case_number}`}
        title={report.student_name}
        description={`${report.category} · filed ${fmtDate(report.incident_date)} by ${report.reported_by_name}`}
      >
        <StatusBadge status={report.status} />
        <SeverityBadge severity={report.severity} />
        {canEdit && (
          <Button variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        )}
        <Link to={`/incidents/${report.id}/print`}>
          <Button className="gap-2">
            <Printer className="h-4 w-4" /> Print report
          </Button>
        </Link>
        {isAdmin && (
          <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        )}
      </PageHeader>

      {isHighAlert(report.severity) && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-300/70 bg-rose-50 px-4 py-3.5 dark:border-rose-500/30 dark:bg-rose-500/10">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-rose-700 dark:text-rose-300">
              High-alert incident · {report.severity}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Emergency-level case. The guidance counselor should notify the parent or guardian right away.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card className="p-5">
            <h2 className="font-display text-lg text-foreground">Incident narrative</h2>
            <div className="mt-4 space-y-4">
              <Block title="Description">{report.description}</Block>
              <div className="grid gap-4 sm:grid-cols-2">
                <Block title="Persons involved">{report.persons_involved}</Block>
                <Block title="Witnesses">{report.witnesses}</Block>
                <Block title="Action taken">{report.action_taken}</Block>
                <Block title="Additional remarks">{report.remarks}</Block>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg text-foreground">Supporting documents</h2>
              {isAdmin && <AttachmentUploader files={[]} onChange={addFiles} />}
            </div>
            <div className="mt-4">
              <AttachmentList attachments={attachments} onRemove={isAdmin ? removeFile : undefined} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-lg text-foreground">Electronic signatures</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Signatures are stored as images and appear on the printed incident report.
            </p>
            <div className="mt-4">
              {isAdmin ? (
                <SignatureManager
                  signatures={{
                    teacher: report.teacher_signature,
                    guardian: report.guardian_signature,
                    principal: report.principal_signature,
                  }}
                  onChange={saveSignatures}
                />
              ) : (
                <SignatureSummary
                  signatures={{
                    teacher: report.teacher_signature,
                    guardian: report.guardian_signature,
                    principal: report.principal_signature,
                  }}
                />
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <ParentNotificationCard report={report} isAdmin={isAdmin} />

          <Card className="p-5">
            <h2 className="font-display text-lg text-foreground">Case details</h2>
            <div className="mt-4 space-y-3.5">
              <Meta icon={User} label="Student" value={`${report.student_name} · ${report.student_number || "No ID"}`} />
              <Meta icon={MapPin} label="Location" value={report.location} />
              <Meta icon={CalendarClock} label="Date & time" value={`${fmtDate(report.incident_date)} · ${fmtTime(report.incident_time)}`} />
              <Meta icon={FilePlus2} label="Department" value={`${report.department} · ${report.grade_level} ${report.section}`} />
              <Meta icon={User} label="Reported by" value={report.reported_by_name} />
            </div>
            <Button asChild variant="outline" className="mt-4 w-full gap-2">
              <Link to={`/students/${report.student_id}`}>
                <User className="h-4 w-4" /> View student history
              </Link>
            </Button>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-lg text-foreground">Case status</h2>
            {isAdmin ? (
              <div className="mt-3 space-y-3">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  rows={2}
                  value={statusNote}
                  onChange={(event) => setStatusNote(event.target.value)}
                  placeholder="Reason for the change (added to the case timeline)"
                />
                <Button
                  className="w-full gap-2"
                  onClick={updateStatus}
                  disabled={savingStatus || newStatus === report.status}
                >
                  {savingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Update case status
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                This report is read-only for teachers. Only the guidance counselor can change the case status, edit the
                details or collect signatures.
              </p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-lg text-foreground">Case timeline</h2>
            <ol className="mt-4 space-y-3">
              {history.length === 0 && <li className="text-xs text-muted-foreground">No status changes recorded yet.</li>}
              {history.map((entry) => (
                <li key={entry.id} className="relative border-l border-border pl-4">
                  <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <p className="text-xs font-semibold text-foreground">{entry.to_status}</p>
                  <p className="text-[11px] text-muted-foreground">{entry.note}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {fmtDateTime(entry.changed_at || entry.created_date)} · {entry.changed_by_name}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <EditIncidentDialog
        report={report}
        open={editOpen}
        onOpenChange={setEditOpen}
        categories={categories}
        onSaved={(updated) => {
          setReport(updated);
          load();
          toast({ title: "Incident updated", description: report.case_number });
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this incident report?"
        description={`Case ${report.case_number} for ${report.student_name}, including its documents and case timeline, will be permanently removed.`}
        confirmLabel={deleting ? "Deleting…" : "Delete report"}
        onConfirm={deleteReport}
      />
    </div>
  );
}