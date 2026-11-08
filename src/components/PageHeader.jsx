import React from "react";

export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="flex flex-col gap-5 border-b border-border/70 pb-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">{eyebrow}</p>
        )}
        <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground md:text-[2.3rem]">
          {title}
        </h1>
        {description && <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}