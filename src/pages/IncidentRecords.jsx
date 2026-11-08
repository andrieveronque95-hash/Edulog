import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FilePlus2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/PageHeader";
import IncidentFilters from "@/components/incidents/IncidentFilters";
import IncidentTable from "@/components/incidents/IncidentTable";
import { Button } from "@/components/ui/button";

const EMPTY_FILTERS = {
  q: "",
  department: "all",
  category: "all",
  severity: "all",
  status: "all",
  from: "",
  to: "",
};

export default function IncidentRecords() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [categories, setCategories] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    base44.entities.IncidentCategory.list({ sort: "name", limit: 100 }).then((page) => {
      if (!cancelled) setCategories(page.items || []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const buildQuery = () => {
    const query = {};
    const conditions = [];
    // Teachers only see cases they filed — matched by record owner or by reporter email.
    if (!isAdmin && user?.email) {
      conditions.push({
        $or: [{ created_by_id: user.id }, { reported_by_email: user.email }],
      });
    }
    if (filters.department !== "all") query.department = filters.department;
    if (filters.category !== "all") query.category = filters.category;
    if (filters.severity !== "all") query.severity = filters.severity;
    if (filters.status !== "all") query.status = filters.status;
    if (filters.from || filters.to) {
      query.incident_date = {};
      if (filters.from) query.incident_date.$gte = filters.from;
      if (filters.to) query.incident_date.$lte = filters.to;
    }
    const term = filters.q.trim();
    if (term) {
      conditions.push({ $or: [{ student_name: { $regex: term } }, { case_number: { $regex: term } }] });
    }
    if (conditions.length) query.$and = conditions;
    return query;
  };

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const page = await base44.entities.IncidentReport.filter(buildQuery(), {
        sort: "-incident_date",
        limit: 25,
      });
      if (cancelled) return;
      setIncidents(page.items || []);
      setCursor(page.next_cursor || null);
      setHasMore(Boolean(page.has_more));
      setLoading(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters, isAdmin, user?.email]);

  const loadMore = async () => {
    const page = await base44.entities.IncidentReport.filter(buildQuery(), {
      sort: "-incident_date",
      limit: 25,
      cursor,
    });
    setIncidents((current) => [...current, ...(page.items || [])]);
    setCursor(page.next_cursor || null);
    setHasMore(Boolean(page.has_more));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Case tracking"
        title="Incident records"
        description={
          isAdmin
            ? "Search and filter every filed case. Filtering only narrows the view — existing records are never changed or removed."
            : "Your submitted incident reports. Filed reports are read-only — contact the guidance counselor for corrections."
        }
      >
        <Link to="/incidents/new">
          <Button className="gap-2">
            <FilePlus2 className="h-4 w-4" /> Record an incident
          </Button>
        </Link>
      </PageHeader>

      <IncidentFilters
        filters={filters}
        setFilters={setFilters}
        categories={categories}
        onReset={() => setFilters(EMPTY_FILTERS)}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {loading ? "Loading cases…" : `${incidents.length}${hasMore ? "+" : ""} case${incidents.length === 1 ? "" : "s"} shown`}
        </p>
      </div>

      <IncidentTable incidents={incidents} loading={loading} />

      {hasMore && (
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={loadMore}>
            Load more cases
          </Button>
        </div>
      )}
    </div>
  );
}