import React from "react";
import { cn } from "@/lib/utils";

const TONES = {
  primary: "bg-primary/10 text-primary",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300",
};

export default function StatCard({ label, value, icon: Icon, tone = "primary", hint }) {
  return (
    <div className="surface group p-4 transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase leading-tight tracking-[0.13em] text-muted-foreground">
          {label}
        </span>
        {Icon && (
          <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", TONES[tone])}>
            <Icon className="h-4 w-4" strokeWidth={1.9} />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-[2.1rem] leading-none text-foreground">{value ?? "—"}</p>
      {hint && <p className="mt-2 text-[11px] leading-tight text-muted-foreground">{hint}</p>}
    </div>
  );
}