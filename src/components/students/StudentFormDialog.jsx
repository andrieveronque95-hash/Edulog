import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { DEPARTMENTS } from "@/lib/constants";

const EMPTY = {
  student_id: "",
  full_name: "",
  grade_level: "",
  section: "",
  department: "Primary",
  gender: "Female",
  guardian_name: "",
  guardian_email: "",
  guardian_contact: "",
  address: "",
  status: "Active",
  notes: "",
};

const labelClass = "mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

export default function StudentFormDialog({ student, open, onOpenChange, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(
      student
        ? {
            student_id: student.student_id || "",
            full_name: student.full_name || "",
            grade_level: student.grade_level || "",
            section: student.section || "",
            department: student.department || "Primary",
            gender: student.gender || "Female",
            guardian_name: student.guardian_name || "",
            guardian_email: student.guardian_email || "",
            guardian_contact: student.guardian_contact || "",
            address: student.address || "",
            status: student.status || "Active",
            notes: student.notes || "",
          }
        : EMPTY
    );
  }, [open, student]);

  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (!form.student_id.trim()) return setError("Student ID is required.");
    if (!form.full_name.trim()) return setError("Full name is required.");
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, student_id: form.student_id.trim(), full_name: form.full_name.trim() };
      const saved = student
        ? await base44.entities.Student.update(student.id, payload)
        : await base44.entities.Student.create(payload);
      onSaved(saved, Boolean(student));
      onOpenChange(false);
    } catch (saveError) {
      setError("The student record could not be saved. Check the Student ID is unique.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student ? "Edit student record" : "Add student"}</DialogTitle>
          <DialogDescription>
            Student profiles are kept separately from incident cases, so every learner has a record even without a case.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2 sm:grid-cols-2">
          <div>
            <Label className={labelClass}>Student ID</Label>
            <Input value={form.student_id} onChange={(event) => set("student_id")(event.target.value)} placeholder="2026-0142" />
          </div>
          <div>
            <Label className={labelClass}>Full name</Label>
            <Input value={form.full_name} onChange={(event) => set("full_name")(event.target.value)} placeholder="Juan A. Dela Cruz" />
          </div>
          <div>
            <Label className={labelClass}>Department</Label>
            <Select value={form.department} onValueChange={set("department")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={labelClass}>Grade / Year level</Label>
            <Input value={form.grade_level} onChange={(event) => set("grade_level")(event.target.value)} placeholder="Grade 8" />
          </div>
          <div>
            <Label className={labelClass}>Section</Label>
            <Input value={form.section} onChange={(event) => set("section")(event.target.value)} placeholder="St. Agnes" />
          </div>
          <div>
            <Label className={labelClass}>Gender</Label>
            <Select value={form.gender} onValueChange={set("gender")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Female", "Male", "Other"].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={labelClass}>Parent / guardian</Label>
            <Input value={form.guardian_name} onChange={(event) => set("guardian_name")(event.target.value)} />
          </div>
          <div>
            <Label className={labelClass}>Guardian contact</Label>
            <Input value={form.guardian_contact} onChange={(event) => set("guardian_contact")(event.target.value)} placeholder="0917 000 0000" />
          </div>
          <div className="sm:col-span-2">
            <Label className={labelClass}>Guardian email (for incident notices)</Label>
            <Input
              type="email"
              value={form.guardian_email}
              onChange={(event) => set("guardian_email")(event.target.value)}
              placeholder="parent@example.com"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className={labelClass}>Address</Label>
            <Input value={form.address} onChange={(event) => set("address")(event.target.value)} />
          </div>
          <div>
            <Label className={labelClass}>Enrollment status</Label>
            <Select value={form.status} onValueChange={set("status")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Active", "Inactive", "Transferred"].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label className={labelClass}>Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={(event) => set("notes")(event.target.value)} />
          </div>
          {error && <p className="sm:col-span-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button className="gap-2" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {student ? "Save changes" : "Add student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}