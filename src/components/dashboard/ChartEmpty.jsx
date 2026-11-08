import React from "react";

export default function ChartEmpty({ label = "No data for this selection yet" }) {
  return (
    <div className="grid h-[220px] place-items-center rounded-xl border border-dashed border-border/80 text-center">
      <p className="max-w-[220px] text-xs text-muted-foreground">{label}</p>
    </div>
  );
}