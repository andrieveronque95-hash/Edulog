import React from "react";
import { cn } from "@/lib/utils";
import { DEPARTMENTS } from "@/lib/constants";

export default function DepartmentFilter({ value, onChange, includeAll = true }) {
  const options = includeAll ? ["all", ...DEPARTMENTS] : DEPARTMENTS;
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-full border border-border/70 bg-card p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200",
            value === option
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          {option === "all" ? "All departments" : option}
        </button>
      ))}
    </div>
  );
}