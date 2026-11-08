import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import moment from "moment";
import { AlertCircle, ArrowLeft, Loader2, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";
import StudentPicker from "@/components/incidents/StudentPicker";
import IncidentDetailsFields from "@/components/incidents/IncidentDetailsFields";
import AttachmentUploader from "@/components/incidents/AttachmentUploader";
import SignatureManager from "@/components/incidents/SignatureManager";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function Section({ title, description, children }) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <h2 className="font-display text-lg text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

export default function RecordIncident() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const presetId = searchParams.get("student");

  const [categories, setCategories] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [signatures, setSignatures] = useState({ teacher: null, guardian: null, principal: null });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    incident_date: moment().format("YYYY-MM-DD"),
    incident_time: moment().format("HH:mm"),
    location: "",
    category: "",
    severity: "Low",
    status: "Open",
    description: "",
    persons_involved: "",
    witnesses: "",
    action_taken: "",
    remarks: "",
  });

  useEffect(() => {
    let cancelled = false;
    base44.entities.IncidentCategory.filter({ active: true }, { sort: "name", limit: 100 }).then((page) => {
      if (!cancelled) setCategories(page.items || []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!presetId) return undefined;
    let cancelled = false;
    base44.entities.Student.get(presetId).then((student) => {
      if (!cancelled) setSelectedStudent(student);
    });
    return () => {
      cancelled = true;
    };
  }, [presetId]);

  const chooseCategory = (name) => {
    const match = categories.find((item) => item.name === name);
    setForm((current) => ({
      ...current,
      category: name,
      severity: match?.default_severity || current.severity,
    }));
  };

  const submit = async () => {
    setError("");
    if (!selectedStudent) return setError("Please select the student involved in the incident.");
    if (!form.incident_date) return setError("Please choose the incident date.");
    if (!form.category) return setError("Please choose an incident category.");
    if (form.description.trim().length < 10) return setError("Describe the incident in at least 10 characters.");

    setSubmitting(true);
    try {
      const response = await base44.functions.invoke("submitIncident", {
        ...form,
        student_id: selectedStudent.id,
        attachments,
        teacher_signature: signatures.teacher,
        guardian_signature: signatures.guardian,
        principal_signature: signatures.principal,
      });
      const report = response.data?.report;
      if (!report) throw new Error("The report was not returned.");
      toast({
        title: "Incident report submitted",
        description: `Case ${report.case_number} has been filed for ${report.student_name}.`,
      });
      navigate(`/incidents/${report.id}`);
    } catch (submitError) {
      setError(
        submitError?.response?.data?.error || "The report could not be saved. Please review the form and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        to="/incidents"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to incident records
      </Link>

      <PageHeader
        eyebrow="New case"
        title="Record an incident"
        description="File a student incident report. A unique case number is generated automatically when you submit."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Section title="Student" description="Select the learner involved in this incident.">
            <StudentPicker selected={selectedStudent} onSelect={setSelectedStudent} />
          </Section>

          <Section title="Incident details" description="Record what happened, where and how serious it was.">
            <IncidentDetailsFields form={form} setForm={setForm} categories={categories} showStatus={false} />
          </Section>

          <Section title="Supporting documents" description="Attach demerit forms, statements or photographs.">
            <AttachmentUploader files={attachments} onChange={setAttachments} />
          </Section>

          <Section
            title="Electronic signatures"
            description="Signatories may sign now or later. A signature is only marked as signed once an actual signature is captured."
          >
            <SignatureManager signatures={signatures} onChange={setSignatures} />
          </Section>
        </div>

        <div className="space-y-4">
          <Card className="p-5 xl:sticky xl:top-20">
            <h2 className="font-display text-lg text-foreground">Submit report</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              The case is filed under your name and locked into the student's incident history. Status changes are
              recorded in the case timeline.
            </p>

            <dl className="mt-4 space-y-2 border-t border-border/70 pt-4 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Student</dt>
                <dd className="truncate font-medium text-foreground">{selectedStudent?.full_name || "Not selected"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="truncate font-medium text-foreground">{form.category || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Severity</dt>
                <dd className="font-medium text-foreground">{form.severity}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Documents</dt>
                <dd className="font-medium text-foreground">{attachments.length}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Signatures</dt>
                <dd className="font-medium text-foreground">
                  {Object.values(signatures).filter(Boolean).length} of 3
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Reported by</dt>
                <dd className="truncate font-medium text-foreground">{user?.full_name || user?.email}</dd>
              </div>
            </dl>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button className="mt-4 w-full gap-2" onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? "Submitting…" : "Submit incident report"}
            </Button>
            <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground">
              Confidential — visible only to the guidance office and authorized teachers.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}