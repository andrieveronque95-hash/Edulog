import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export const DEFAULT_SETTINGS = {
  school_name: "",
  school_address: "",
  office_name: "",
  principal_name: "",
  counselor_name: "",
  academic_year: "",
  logo_url: "",
  report_footer: "",
};

export function useSchoolSettings() {
  const [settings, setSettings] = useState(null);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { items } = await base44.entities.SchoolSettings.list({ limit: 1 });
        if (cancelled) return;
        if (items?.[0]) {
          setSettings({ ...DEFAULT_SETTINGS, ...items[0] });
          setRecordId(items[0].id);
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, recordId, loading, setSettings };
}