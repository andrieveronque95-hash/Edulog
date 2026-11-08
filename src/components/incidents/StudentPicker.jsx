import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function StudentPicker({ selected, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const trimmed = query.trim();
      const filter = trimmed
        ? { $or: [{ full_name: { $regex: trimmed } }, { student_id: { $regex: trimmed } }] }
        : {};
      try {
        const { items } = await base44.entities.Student.filter(filter, { sort: "full_name", limit: 12 });
        if (!cancelled) setResults(items || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  if (selected) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{selected.full_name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {selected.student_id} · {selected.grade_level} {selected.section} · {selected.department}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={() => onSelect(null)}>
          <X className="h-3.5 w-3.5" /> Change
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search student by name or student ID"
          className="pl-9"
        />
      </div>
      <div className="max-h-64 overflow-y-auto rounded-xl border border-border/70 bg-card">
        {loading && <p className="px-3 py-4 text-xs text-muted-foreground">Searching…</p>}
        {!loading && results.length === 0 && (
          <p className="px-3 py-4 text-xs text-muted-foreground">
            No students found. Add the student record in the Students module first.
          </p>
        )}
        {!loading &&
          results.map((student) => (
            <button
              key={student.id}
              type="button"
              onClick={() => onSelect(student)}
              className="flex w-full items-center justify-between gap-3 border-b border-border/60 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-secondary"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">{student.full_name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {student.student_id} · {student.department}
                </span>
              </span>
              <span className="shrink-0 text-[11px] text-muted-foreground">{student.grade_level}</span>
            </button>
          ))}
      </div>
    </div>
  );
}