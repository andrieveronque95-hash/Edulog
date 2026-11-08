import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import moment from "moment";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import SignatureImage from "@/components/incidents/SignatureImage";
import { DEFAULT_SETTINGS } from "@/lib/useSchoolSettings";
import { fmtLongDate, fmtTime } from "@/lib/constants";

function Row({ label, value, wide = false }) {
  return (
    <div className={`flex gap-2 border-b border-slate-300 px-2 py-1.5 ${wide ? "col-span-2" : ""}`}>
      <span className="w-[38%] shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-[11px] text-slate-900">{value || "—"}</span>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="mb-1.5 mt-5 border-b border-slate-900 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900">
      {children}
    </h2>
  );
}

function SignatureBlock({ title, signature }) {
  const pending = !signature;
  return (
    <div className="text-center">
      <div className="flex h-[62px] items-end justify-center">
        {pending ? (
          <span className="text-[9px] uppercase tracking-widest text-slate-400">Pending</span>
        ) : (
          <SignatureImage fileUri={signature.file_uri} className="h-[58px]" />
        )}
      </div>
      <div className="mx-auto mt-1 w-full border-t border-slate-900" />
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-900">
        {signature?.name || "____________________"}
      </p>
      <p className="text-[9px] text-slate-600">{title}</p>
      <p className="mt-1 text-[9px] text-slate-500">
        {signature ? `Signed ${moment(signature.signed_date).format("MMM D, YYYY")}` : "Signature pending"}
      </p>
    </div>
  );
}

export default function IncidentPrint() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const record = await base44.entities.IncidentReport.get(id);
      const [files, school] = await Promise.all([
        base44.entities.IncidentAttachment.filter({ incident_id: id }, { limit: 20 }),
        base44.entities.SchoolSettings.list({ limit: 1 }),
      ]);
      if (cancelled) return;
      setReport(record);
      setAttachments(files.items || []);
      if (school.items?.[0]) setSettings({ ...DEFAULT_SETTINGS, ...school.items[0] });
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-100">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">This incident record could not be found.</p>
          <Link to="/incidents" className="mt-2 inline-block text-xs text-slate-500 underline">
            Back to incident records
          </Link>
        </div>
      </div>
    );
  }

  const initials = (settings.school_name || "School")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

  return (
    <div className="min-h-screen bg-slate-200 py-6 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 px-4">
        <Link to={`/incidents/${report.id}`}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to case
          </Button>
        </Link>
        <Button className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </Button>
      </div>

      <article className="print-sheet mx-auto bg-white px-[16mm] py-[14mm] text-slate-900 shadow-xl">
        <header className="flex items-start gap-4">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="School logo" className="h-16 w-16 rounded-full border border-slate-300 object-cover" />
          ) : (
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-slate-900 font-display text-xl text-slate-900">
              {initials}
            </div>
          )}
          <div className="flex-1 text-center">
            <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500">Republic of the Philippines · Department of Education</p>
            <h1 className="mt-1 font-display text-[21px] uppercase leading-tight tracking-wide text-slate-900">
              {settings.school_name}
            </h1>
            <p className="text-[10px] text-slate-600">{settings.school_address}</p>
            {settings.office_name ? (
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-800">
                {settings.office_name}
              </p>
            ) : null}
          </div>
          <div className="h-16 w-16 shrink-0" />
        </header>

        <div className="mt-5 flex items-end justify-between border-b-2 border-slate-900 pb-2">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.24em] text-slate-900">
            Student Incident Report
          </h2>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-widest text-slate-500">Case number</p>
            <p className="font-mono text-[12px] font-bold text-slate-900">{report.case_number}</p>
          </div>
        </div>

        <SectionTitle>I. Student information</SectionTitle>
        <div className="grid grid-cols-2 border-l border-t border-slate-300">
          <Row label="Student name" value={report.student_name} />
          <Row label="Student ID" value={report.student_number} />
          <Row label="Department" value={report.department} />
          <Row label="Grade / Year level" value={report.grade_level} />
          <Row label="Section" value={report.section} />
          <Row label="Reported by" value={report.reported_by_name} />
        </div>

        <SectionTitle>II. Incident details</SectionTitle>
        <div className="grid grid-cols-2 border-l border-t border-slate-300">
          <Row label="Date of incident" value={fmtLongDate(report.incident_date)} />
          <Row label="Time" value={fmtTime(report.incident_time)} />
          <Row label="Location" value={report.location} />
          <Row label="Category" value={report.category} />
          <Row label="Severity" value={report.severity} />
          <Row label="Case status" value={report.status} />
        </div>

        <SectionTitle>III. Incident description</SectionTitle>
        <p className="min-h-[70px] whitespace-pre-line border border-slate-300 p-2.5 text-[11px] leading-relaxed text-slate-800">
          {report.description}
        </p>

        <SectionTitle>IV. Parties and action taken</SectionTitle>
        <div className="grid grid-cols-2 border-l border-t border-slate-300">
          <Row label="Persons involved" value={report.persons_involved} />
          <Row label="Witnesses" value={report.witnesses} />
          <Row label="Action taken" value={report.action_taken} />
          <Row label="Remarks" value={report.remarks} />
        </div>

        <SectionTitle>V. Supporting documents</SectionTitle>
        {attachments.length === 0 ? (
          <p className="border border-slate-300 p-2.5 text-[10px] italic text-slate-500">No documents attached.</p>
        ) : (
          <ol className="border border-slate-300 p-2.5 text-[10px] text-slate-800">
            {attachments.map((file, index) => (
              <li key={file.id} className="list-inside list-decimal">
                {file.file_name}
                {file.uploaded_by_name ? ` — uploaded by ${file.uploaded_by_name}` : ""}
              </li>
            ))}
          </ol>
        )}

        <SectionTitle>VI. Signatures</SectionTitle>
        <div className="grid grid-cols-3 gap-5 pt-4">
          <SignatureBlock title="Class Adviser / Teacher" signature={report.teacher_signature} />
          <SignatureBlock title="Parent or Guardian" signature={report.guardian_signature} />
          <SignatureBlock title="School Principal" signature={report.principal_signature} />
        </div>

        <footer className="mt-8 border-t border-slate-300 pt-2">
          {settings.report_footer ? (
            <p className="text-[9px] leading-relaxed text-slate-500">{settings.report_footer}</p>
          ) : null}
          <div className="mt-1 flex justify-between text-[9px] text-slate-500">
            <span>Generated {moment().format("MMMM D, YYYY · h:mm A")}</span>
            {settings.academic_year ? <span>Academic year {settings.academic_year}</span> : null}
          </div>
        </footer>
      </article>
    </div>
  );
}