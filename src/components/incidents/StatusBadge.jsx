import React from "react";
import { cn } from "@/lib/utils";
import { STATUS_STYLES } from "@/lib/constants";

export default function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        STATUS_STYLES[status] || STATUS_STYLES.Closed,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status || "—"}
    </span>
  );
}