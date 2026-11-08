import React from "react";
import moment from "moment";
import { CheckCircle2 } from "lucide-react";
import SignatureImage from "@/components/incidents/SignatureImage";
import { SIGNATORY_LABELS } from "@/lib/constants";

const ROLES = ["teacher", "guardian", "principal"];

export default function SignatureSummary({ signatures = {} }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {ROLES.map((role) => {
        const signature = signatures?.[role];
        return (
          <div
            key={role}
            className={`rounded-xl border p-4 ${
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
            {signature && (
              <div className="mt-3 space-y-2">
                <div className="rounded-lg border border-border/60 bg-white p-2">
                  <SignatureImage fileUri={signature.file_uri} className="h-14" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Signed {signature.signed_date ? moment(signature.signed_date).format("MMM D, YYYY · h:mm A") : "—"}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}