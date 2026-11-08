import React from "react";
import { cn } from "@/lib/utils";
import { SEVERITY_STYLES } from "@/lib/constants";

export default function SeverityBadge({ severity, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        SEVERITY_STYLES[severity] || SEVERITY_STYLES.Low,
        className
      )}
    >
      {severity || "—"}
    </span>
  );
}