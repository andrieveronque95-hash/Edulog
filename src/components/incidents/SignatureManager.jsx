import React, { useState } from "react";
import moment from "moment";
import { CheckCircle2, Loader2, PenLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SignaturePad from "@/components/incidents/SignaturePad";
import SignatureImage from "@/components/incidents/SignatureImage";
import { SIGNATORY_LABELS } from "@/lib/constants";
import { uploadSignatureImage } from "@/lib/files";

const ROLES = ["teacher", "guardian", "principal"];

export default function SignatureManager({ signatures = {}, onChange }) {
  const [openRole, setOpenRole] = useState(null);
  const [name, setName] = useState("");
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const begin = (role) => {
    setOpenRole(role);
    setName(signatures?.[role]?.name || "");
    setDraft(null);
    setError("");
  };

  const save = async (role) => {
    if (!name.trim()) {
      setError("Enter the signer's full name.");
      return;
    }
    if (!draft) {
      setError("Please draw a signature before saving.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const fileUri = await uploadSignatureImage(draft, role);
      onChange({
        ...signatures,
        [role]: {
          name: name.trim(),
          role: SIGNATORY_LABELS[role],
          signed_date: new Date().toISOString(),
          file_uri: fileUri,
        },
      });
      setOpenRole(null);
      setDraft(null);
    } catch (saveError) {
      setError("The signature could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {ROLES.map((role) => {
        const signature = signatures?.[role];
        const isOpen = openRole === role;
        return (
          <div
            key={role}
            className={`rounded-xl border p-4 transition-colors ${
              signature ? "border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-500/5" : "border-border/70 bg-card"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {SIGNATORY_LABELS[role]}
                </p>
                <p className="mt-0.5 text-xs font-medium text-foreground">
                  {signature ? signature.name : "Awaiting signature"}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                  signature
                    ? "bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/15 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 ring-amber-600/20 dark:bg-amber-400/15 dark:text-amber-300"
                }`}
              >
                {signature && <CheckCircle2 className="h-3 w-3" />}
                {signature ? "Signed" : "Pending"}
              </span>
            </div>

            {signature && !isOpen && (
              <div className="mt-3 space-y-2">
                <div className="rounded-lg border border-border/60 bg-white p-2">
                  <SignatureImage fileUri={signature.file_uri} className="h-14" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Signed {signature.signed_date ? moment(signature.signed_date).format("MMM D, YYYY · h:mm A") : "—"}
                </p>
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant="ghost" className="gap-1" onClick={() => begin(role)}>
                    <PenLine className="h-3.5 w-3.5" /> Re-sign
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-destructive hover:text-destructive"
                    onClick={() => onChange({ ...signatures, [role]: null })}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              </div>
            )}

            {!signature && !isOpen && (
              <Button type="button" size="sm" variant="outline" className="mt-3 w-full gap-1.5" onClick={() => begin(role)}>
                <PenLine className="h-3.5 w-3.5" /> Add signature
              </Button>
            )}

            {isOpen && (
              <div className="mt-3 space-y-3">
                <div>
                  <Label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Signer's full name
                  </Label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" />
                </div>
                <SignaturePad onChange={setDraft} />
                {error && <p className="text-[11px] text-destructive">{error}</p>}
                <div className="flex gap-2">
                  <Button type="button" size="sm" className="flex-1 gap-1.5" disabled={busy} onClick={() => save(role)}>
                    {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save signature
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setOpenRole(null)} disabled={busy}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}