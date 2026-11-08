import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import IncidentDetailsFields from "@/components/incidents/IncidentDetailsFields";
import { base44 } from "@/api/base44Client";
import { SEVERITIES } from "@/lib/constants";

export default function EditIncidentDialog({ report, open, onOpenChange, onSaved, categories }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && report) {
      setForm({
        incident_date: report.incident_date || "",
        incident_time: report.incident_time || "",
        location: report.location || "",
        category: report.category || "",
        severity: SEVERITIES.includes(report.severity) ? report.severity : "Low",
        status: report.status || "Open",
        description: report.description || "",
        persons_involved: report.persons_involved || "",
        witnesses: report.witnesses || "",
        action_taken: report.action_taken || "",
        remarks: report.remarks || "",
      });
      setError("");
    }
  }, [open, report]);

  const save = async () => {
    if (!form.incident_date) return setError("Incident date is required.");
    if (!form.category) return setError("Select an incident category.");
    if (!form.description.trim()) return setError("Incident description is required.");
    setSaving(true);
    setError("");
    try {
      const updated = await base44.entities.IncidentReport.update(report.id, {
        incident_date: form.incident_date,
        incident_time: form.incident_time,
        location: form.location,
        category: form.category,
        severity: form.severity,
        description: form.description,
        persons_involved: form.persons_involved,
        witnesses: form.witnesses,
        action_taken: form.action_taken,
        remarks: form.remarks,
      });
      onSaved(updated);
      onOpenChange(false);
    } catch (saveError) {
      setError("The changes could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit incident details</DialogTitle>
          <DialogDescription>
            Case {report?.case_number} — updates are saved to the student's permanent case record.
          </DialogDescription>
        </DialogHeader>
        {form && (
          <div className="py-2">
            <IncidentDetailsFields form={form} setForm={setForm} categories={categories} showStatus={false} />
            {error && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button className="gap-2" onClick={save} disabled={saving || !form}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}