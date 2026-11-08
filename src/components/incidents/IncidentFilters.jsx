import React from "react";
import { RotateCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEPARTMENTS, SEVERITIES, STATUSES } from "@/lib/constants";

const labelClass = "mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

export default function IncidentFilters({ filters, setFilters, categories, onReset }) {
  const set = (key) => (value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div className="surface space-y-4 p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="xl:col-span-2">
          <Label className={labelClass}>Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.q}
              onChange={(event) => set("q")(event.target.value)}
              placeholder="Student name or case number"
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <Label className={labelClass}>Department</Label>
          <Select value={filters.department} onValueChange={set("department")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {DEPARTMENTS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className={labelClass}>Category</Label>
          <Select value={filters.category} onValueChange={set("category")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((item) => (
                <SelectItem key={item.id} value={item.name}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className={labelClass}>Severity</Label>
          <Select value={filters.severity} onValueChange={set("severity")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              {SEVERITIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className={labelClass}>Status</Label>
          <Select value={filters.status} onValueChange={set("status")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className={labelClass}>From</Label>
          <Input type="date" value={filters.from} onChange={(event) => set("from")(event.target.value)} />
        </div>
        <div>
          <Label className={labelClass}>To</Label>
          <Input type="date" value={filters.to} onChange={(event) => set("to")(event.target.value)} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={onReset}>
          <RotateCcw className="h-3.5 w-3.5" /> Clear filters
        </Button>
      </div>
    </div>
  );
}