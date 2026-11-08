import React from "react";
import { Link } from "react-router-dom";
import { Eye, Printer } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/incidents/StatusBadge";
import SeverityBadge from "@/components/incidents/SeverityBadge";
import { fmtDate, isHighAlert } from "@/lib/constants";

export default function IncidentTable({ incidents = [], loading = false }) {
  return (
    <div className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40 hover:bg-secondary/40">
              <TableHead>Case no.</TableHead>
              <TableHead>Student</TableHead>
              <TableHead className="hidden lg:table-cell">Department</TableHead>
              <TableHead>Incident date</TableHead>
              <TableHead className="hidden xl:table-cell">Category</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden xl:table-cell">Reported by</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell colSpan={9}>
                    <div className="h-6 w-full animate-pulse rounded bg-secondary" />
                  </TableCell>
                </TableRow>
              ))}

            {!loading && incidents.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-14 text-center text-sm text-muted-foreground">
                  No incident records match these filters.
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              incidents.map((incident) => (
                <TableRow key={incident.id} className="group">
                  <TableCell>
                    <Link to={`/incidents/${incident.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">
                      {incident.case_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link to={`/incidents/${incident.id}`} className="block max-w-[190px] truncate text-sm font-medium text-foreground hover:text-primary">
                      {incident.student_name}
                    </Link>
                    <span className="text-[11px] text-muted-foreground">
                      {incident.grade_level} {incident.section}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{incident.department}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(incident.incident_date)}</TableCell>
                  <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                    <span className="block max-w-[160px] truncate">{incident.category}</span>
                  </TableCell>
                  <TableCell>
                    <SeverityBadge severity={incident.severity} />
                    {isHighAlert(incident.severity) && (
                      <span className="ml-1 inline-flex items-center rounded-md bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                        High alert
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={incident.status} />
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                    <span className="block max-w-[150px] truncate">{incident.reported_by_name}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/incidents/${incident.id}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                        title="Open case"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/incidents/${incident.id}/print`}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                        title="Print report"
                      >
                        <Printer className="h-4 w-4" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}