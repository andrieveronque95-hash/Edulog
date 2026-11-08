import React, { useEffect, useState } from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEVERITIES } from "@/lib/constants";

export default function CategoryManager({ isAdmin }) {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [severity, setSeverity] = useState("Low");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [removingBusy, setRemovingBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSeverity, setEditSeverity] = useState("Low");
  const [savingEdit, setSavingEdit] = useState(false);

  const load = async () => {
    const page = await base44.entities.IncidentCategory.list({ sort: "name", limit: 200 });
    setCategories(page.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const exists = (value, ignoreId) =>
    categories.some(
      (item) => item.id !== ignoreId && item.name.trim().toLowerCase() === value.trim().toLowerCase()
    );

  const add = async () => {
    if (!name.trim()) return;
    if (exists(name)) {
      toast({ title: "Category already exists", description: name.trim(), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const created = await base44.entities.IncidentCategory.create({
        name: name.trim(),
        default_severity: severity,
        active: true,
      });
      setCategories((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      toast({ title: "Category added", description: created.name });
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (category) => {
    const updated = await base44.entities.IncidentCategory.update(category.id, { active: !category.active });
    setCategories((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditSeverity(category.default_severity || "Low");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (category) => {
    if (!editName.trim()) return;
    if (exists(editName, category.id)) {
      toast({ title: "Category already exists", description: editName.trim(), variant: "destructive" });
      return;
    }
    setSavingEdit(true);
    try {
      const oldName = category.name;
      const updated = await base44.entities.IncidentCategory.update(category.id, {
        name: editName.trim(),
        default_severity: editSeverity,
      });
      setCategories((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);

      if (oldName !== updated.name) {
        const reports = await base44.entities.IncidentReport.filter({ category: oldName }, { limit: 100 });
        const rows = (reports.items || []).map((report) => ({ id: report.id, category: updated.name }));
        if (rows.length) await base44.entities.IncidentReport.bulkUpdate(rows);
      }

      toast({ title: "Category updated", description: updated.name });
    } finally {
      setSavingEdit(false);
    }
  };

  const remove = async () => {
    if (!removing) return;
    setRemovingBusy(true);
    try {
      const inUse = await base44.entities.IncidentReport.count({ category: removing.name });
      if (inUse > 0) {
        toast({
          title: "Category is in use",
          description: `"${removing.name}" is used by ${inUse} incident report${inUse === 1 ? "" : "s"}. Deactivate it instead so historical records stay intact.`,
          variant: "destructive",
        });
        setRemoving(null);
        return;
      }
      await base44.entities.IncidentCategory.delete(removing.id);
      setCategories((current) => current.filter((item) => item.id !== removing.id));
      toast({ title: "Category removed", description: removing.name });
      setRemoving(null);
    } finally {
      setRemovingBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="New category, e.g. Bullying"
            className="flex-1"
          />
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEVERITIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="gap-2" onClick={add} disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
          </Button>
        </div>
      )}

      {loading ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Loading categories…</p>
      ) : categories.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">No categories yet.</p>
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70">
          {categories.map((category) => {
            const isEditing = editingId === category.id;
            return (
              <li key={category.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                {isEditing ? (
                  <>
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                      <Input
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        className="h-8 flex-1 text-sm"
                      />
                      <Select value={editSeverity} onValueChange={setEditSeverity}>
                        <SelectTrigger className="h-8 sm:w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SEVERITIES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                        onClick={() => saveEdit(category)}
                        disabled={savingEdit}
                      >
                        {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={cancelEdit}
                        disabled={savingEdit}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{category.name}</p>
                      <p className="text-[11px] text-muted-foreground">Default severity: {category.default_severity}</p>
                    </div>
                    {isAdmin ? (
                      <>
                        <Switch checked={Boolean(category.active)} onCheckedChange={() => toggle(category)} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => startEdit(category)}
                          title="Edit category"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setRemoving(category)}
                          title="Delete category"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">{category.active ? "Active" : "Inactive"}</span>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove this category?"
        description={`"${removing?.name}" will no longer be selectable. Categories already used in incident reports cannot be deleted — deactivate them instead.`}
        confirmLabel={removingBusy ? "Removing…" : "Remove category"}
        onConfirm={remove}
      />
    </div>
  );
}