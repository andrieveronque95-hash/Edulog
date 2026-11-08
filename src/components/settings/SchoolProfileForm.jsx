import React, { useEffect, useState } from "react";
import { ImagePlus, Loader2, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const labelClass = "mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

export default function SchoolProfileForm({ settings, recordId: initialRecordId, isAdmin, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(settings || {});
  const [recordId, setRecordId] = useState(initialRecordId);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(settings || {});
    setRecordId(initialRecordId);
  }, [settings, initialRecordId]);

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const uploadLogo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setForm((current) => ({ ...current, logo_url: file_url }));
    } catch (uploadError) {
      setError("The logo could not be uploaded.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const save = async () => {
    if (!form.school_name?.trim()) return setError("The school name is required.");
    setSaving(true);
    setError("");
    try {
      const payload = {
        school_name: form.school_name,
        school_address: form.school_address || "",
        office_name: form.office_name || "",
        principal_name: form.principal_name || "",
        counselor_name: form.counselor_name || "",
        academic_year: form.academic_year || "",
        logo_url: form.logo_url || "",
        report_footer: form.report_footer || "",
      };
      const saved = recordId
        ? await base44.entities.SchoolSettings.update(recordId, payload)
        : await base44.entities.SchoolSettings.create(payload);
      setRecordId(saved.id);
      onSaved(saved);
      toast({ title: "School profile saved", description: "Printed reports now use these details." });
    } catch (saveError) {
      setError("The school profile could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-secondary">
          {form.logo_url ? (
            <img src={form.logo_url} alt="School logo" className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-lg text-muted-foreground">Logo</span>
          )}
        </div>
        {isAdmin && (
          <div>
            <input id="school-logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={uploadLogo} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={uploading}
              onClick={() => document.getElementById("school-logo")?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              Upload logo
            </Button>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Appears on printed reports (stored publicly — anyone with the link can open it).
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label className={labelClass}>School name</Label>
          <Input value={form.school_name || ""} onChange={set("school_name")} disabled={!isAdmin} />
        </div>
        <div className="sm:col-span-2">
          <Label className={labelClass}>School address</Label>
          <Input value={form.school_address || ""} onChange={set("school_address")} disabled={!isAdmin} />
        </div>
        <div>
          <Label className={labelClass}>Office name</Label>
          <Input value={form.office_name || ""} onChange={set("office_name")} disabled={!isAdmin} />
        </div>
        <div>
          <Label className={labelClass}>Academic year</Label>
          <Input value={form.academic_year || ""} onChange={set("academic_year")} disabled={!isAdmin} />
        </div>
        <div>
          <Label className={labelClass}>Principal</Label>
          <Input value={form.principal_name || ""} onChange={set("principal_name")} disabled={!isAdmin} />
        </div>
        <div>
          <Label className={labelClass}>Guidance counselor</Label>
          <Input value={form.counselor_name || ""} onChange={set("counselor_name")} disabled={!isAdmin} />
        </div>
        <div className="sm:col-span-2">
          <Label className={labelClass}>Report footer note</Label>
          <Textarea rows={2} value={form.report_footer || ""} onChange={set("report_footer")} disabled={!isAdmin} />
        </div>
      </div>

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

      {isAdmin && (
        <div className="flex justify-end">
          <Button className="gap-2" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save school profile
          </Button>
        </div>
      )}
    </div>
  );
}