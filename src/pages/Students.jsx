import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Pencil, Plus, Search, UserPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import StudentFormDialog from "@/components/students/StudentFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { DEPARTMENTS } from "@/lib/constants";

export default function Students() {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [caseCounts, setCaseCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const buildFilter = () => {
    const filter = {};
    if (department !== "all") filter.department = department;
    const term = query.trim();
    if (term) filter.$or = [{ full_name: { $regex: term } }, { student_id: { $regex: term } }];
    return filter;
  };

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const page = await base44.entities.Student.filter(buildFilter(), { sort: "full_name", limit: 25 });
      if (cancelled) return;
      setStudents(page.items || []);
      setCursor(page.next_cursor || null);
      setHasMore(Boolean(page.has_more));
      setLoading(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, department]);

  useEffect(() => {
    let cancelled = false;
    base44.entities.IncidentReport.aggregate({ query: {}, groupBy: "student_id" })
      .then((result) => {
        if (cancelled) return;
        const map = {};
        (result.rows || []).forEach((row) => {
          map[row.student_id] = row.count;
        });
        setCaseCounts(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = async () => {
    const page = await base44.entities.Student.filter(buildFilter(), { sort: "full_name", limit: 25, cursor });
    setStudents((current) => [...current, ...(page.items || [])]);
    setCursor(page.next_cursor || null);
    setHasMore(Boolean(page.has_more));
  };

  const handleSaved = (student, isEdit) => {
    setStudents((current) =>
      isEdit ? current.map((item) => (item.id === student.id ? student : item)) : [student, ...current]
    );
    toast({ title: isEdit ? "Student record updated" : "Student added", description: student.full_name });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student records"
        title="Students"
        description="Every learner has a profile even without a case. Open a student to review their complete incident history."
      >
        <Button
          className="gap-2"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <UserPlus className="h-4 w-4" /> Add student
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or student ID"
            className="pl-9"
          />
        </div>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="sm:w-56">
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

      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                <TableHead>Student</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead className="hidden md:table-cell">Grade / Section</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Cases</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                    Loading students…
                  </TableCell>
                </TableRow>
              )}

              {!loading && students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-14 text-center">
                    <p className="text-sm font-medium text-foreground">No students found</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Add a student record or adjust your search filters.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 gap-1.5"
                      onClick={() => {
                        setEditing(null);
                        setFormOpen(true);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add student
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Link to={`/students/${student.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                        {student.full_name}
                      </Link>
                      <span className="block text-[11px] text-muted-foreground">{student.status || "Active"}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{student.student_id}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {student.grade_level} {student.section ? `· ${student.section}` : ""}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{student.department}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex min-w-[26px] justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          caseCounts[student.id]
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {caseCounts[student.id] || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/students/${student.id}`}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                          title="View profile"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                          title="Edit student"
                          onClick={() => {
                            setEditing(student);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        {hasMore && (
          <div className="border-t border-border/70 p-3 text-center">
            <Button variant="ghost" size="sm" onClick={loadMore}>
              Load more students
            </Button>
          </div>
        )}
      </div>

      <StudentFormDialog student={editing} open={formOpen} onOpenChange={setFormOpen} onSaved={handleSaved} />
    </div>
  );
}