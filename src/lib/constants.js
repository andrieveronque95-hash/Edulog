import moment from "moment";

export const DEPARTMENTS = ["Preschool", "Primary", "Secondary", "Junior High School"];
export const SEVERITIES = ["Low", "Medium", "High", "Critical"];
export const STATUSES = ["Open", "Under Investigation", "Resolved", "Closed"];
export const HIGH_ALERT_SEVERITIES = ["High", "Critical"];
export const isHighAlert = (severity) => HIGH_ALERT_SEVERITIES.includes(severity);

export const STATUS_STYLES = {
  Open: "bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/30",
  "Under Investigation":
    "bg-sky-100 text-sky-800 ring-sky-600/20 dark:bg-sky-400/15 dark:text-sky-300 dark:ring-sky-400/30",
  Resolved:
    "bg-emerald-100 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/30",
  Closed:
    "bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-400/15 dark:text-slate-300 dark:ring-slate-400/30",
};

export const SEVERITY_STYLES = {
  Low: "bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-400/15 dark:text-teal-300 dark:ring-teal-400/30",
  Medium:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/30",
  High: "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-400/15 dark:text-orange-300 dark:ring-orange-400/30",
  Critical:
    "bg-rose-100 text-rose-700 ring-rose-600/25 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/30",
};

export const DEPARTMENT_HEX = {
  Preschool: "#f59e0b",
  Primary: "#14b8a6",
  Secondary: "#4f46e5",
  "Junior High School": "#e11d48",
};

export const SEVERITY_HEX = {
  Low: "#0d9488",
  Medium: "#d97706",
  High: "#ea580c",
  Critical: "#e11d48",
};

export const STATUS_HEX = {
  Open: "#f59e0b",
  "Under Investigation": "#0ea5e9",
  Resolved: "#10b981",
  Closed: "#64748b",
};

export const SIGNATORY_LABELS = {
  teacher: "Class Adviser / Teacher",
  guardian: "Parent or Guardian",
  principal: "School Principal",
};

export const fmtDate = (value) => (value ? moment(value).format("MMM D, YYYY") : "—");

export const fmtLongDate = (value) => (value ? moment(value).format("MMMM D, YYYY") : "—");

export const fmtTime = (value) => {
  if (!value) return "—";
  const parsed = moment(value, ["HH:mm", "H:mm", "hh:mm A"], true);
  return parsed.isValid() ? parsed.format("h:mm A") : value;
};

export const fmtDateTime = (value) => (value ? moment(value).format("MMM D, YYYY · h:mm A") : "—");

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

export const firstName = (name = "") => name.split(" ")[0] || name;

export const monthsBack = (count) => {
  const out = [];
  for (let i = count - 1; i >= 0; i -= 1) out.push(moment().subtract(i, "months"));
  return out;
};