import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEVERITIES, STATUSES } from "@/lib/constants";

function Field({ label, hint, children, className = "" }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function IncidentDetailsFields({ form, setForm, categories, showStatus = true }) {
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Incident date">
          <Input type="date" value={form.incident_date} onChange={(event) => set("incident_date")(event.target.value)} />
        </Field>
        <Field label="Incident time">
          <Input type="time" value={form.incident_time} onChange={(event) => set("incident_time")(event.target.value)} />
        </Field>
        <Field label="Location">
          <Input
            placeholder="e.g. Science Laboratory, 2nd floor"
            value={form.location}
            onChange={(event) => set("location")(event.target.value)}
          />
        </Field>
        <Field label="Category">
          <Select value={form.category} onValueChange={set("category")}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Severity">
          <Select value={form.severity} onValueChange={set("severity")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEVERITIES.map((severity) => (
                <SelectItem key={severity} value={severity}>
                  {severity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Case status" hint={showStatus ? undefined : "Only the guidance counselor can change the case status."}>
          <Select value={form.status} onValueChange={set("status")} disabled={!showStatus}>
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
        </Field>
      </div>

      <Field label="Incident description" hint="Describe what happened, in order, using factual language.">
        <Textarea
          rows={5}
          placeholder="During the lunch break, the student…"
          value={form.description}
          onChange={(event) => set("description")(event.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Persons involved">
          <Textarea
            rows={3}
            placeholder="Students, staff or others directly involved"
            value={form.persons_involved}
            onChange={(event) => set("persons_involved")(event.target.value)}
          />
        </Field>
        <Field label="Witnesses">
          <Textarea
            rows={3}
            placeholder="Names of witnesses"
            value={form.witnesses}
            onChange={(event) => set("witnesses")(event.target.value)}
          />
        </Field>
        <Field label="Action taken">
          <Textarea
            rows={3}
            placeholder="Immediate action, referral or sanction"
            value={form.action_taken}
            onChange={(event) => set("action_taken")(event.target.value)}
          />
        </Field>
        <Field label="Additional remarks">
          <Textarea
            rows={3}
            placeholder="Notes for the guidance office"
            value={form.remarks}
            onChange={(event) => set("remarks")(event.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}