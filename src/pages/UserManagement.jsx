import React, { useEffect, useState } from "react";
import { Loader2, Power, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import PageHeader from "@/components/PageHeader";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEPARTMENTS } from "@/lib/constants";

const labelClass = "mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";

const EMPTY = { full_name: "", email: "", department: "All Departments", position: "Subject Teacher" };

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const [profiles, setProfiles] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(null);
  const [profileLoadError, setProfileLoadError] = useState("");
  const [accountsLoadError, setAccountsLoadError] = useState("");

  const load = async () => {
    const [profileResult, accountsResult] = await Promise.allSettled([
      base44.entities.TeacherProfile.list({ sort: "full_name", limit: 100 }),
      base44.functions.invoke("createTeacherAccount", { action: "list_accounts" }),
    ]);
    if (profileResult.status === "fulfilled") {
      setProfiles(profileResult.value.items || []);
      setProfileLoadError("");
    } else {
      setProfileLoadError("Teacher profiles could not be loaded. Refresh this page to try again.");
    }
    if (accountsResult.status === "fulfilled") {
      setAccounts(accountsResult.value.data?.accounts || []);
      setAccountsLoadError("");
    } else {
      setAccountsLoadError("The sign-in account list is unavailable. You can still add a teacher above.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const changeRole = async (account, role) => {
    if (role === account.role) return;
    await base44.functions.invoke("createTeacherAccount", {
      action: "update_role",
      account_id: account.id,
      role,
    });
    setAccounts((current) => current.map((item) => (item.id === account.id ? { ...item, role } : item)));
    toast({
      title: "Role updated",
      description: `${account.email} is now ${role === "admin" ? "a guidance counselor (admin)" : "a teacher"}.`,
    });
  };

  const createTeacher = async () => {
    setError("");
    if (!form.full_name.trim()) return setError("Enter the teacher's full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError("Enter a valid email address.");

    const email = form.email.trim().toLowerCase();
    setSaving(true);
    try {
      const response = await base44.functions.invoke("createTeacherAccount", {
        full_name: form.full_name.trim(),
        email,
        department: form.department,
        position: form.position,
      });
      const savedProfile = response.data.profile;
      setProfiles((current) => [...current.filter((item) => item.id !== savedProfile.id), savedProfile]
        .sort((a, b) => a.full_name.localeCompare(b.full_name)));
      setProfileLoadError("");
      toast({
        title: response.data?.invited ? "Teacher invitation sent" : "Teacher access granted",
        description: response.data?.invited
          ? `An invitation email was sent to ${email}. The teacher sets their own password from that link.`
          : `${email} already had a sign-in account. It was not modified — only teacher access was added.`,
      });
      setDialogOpen(false);
      setForm(EMPTY);
    } catch (inviteError) {
      setError(
        inviteError?.response?.data?.error || inviteError?.message ||
          "The invitation could not be sent. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (profile) => {
    const updated = await base44.entities.TeacherProfile.update(profile.id, { active: !profile.active });
    setProfiles((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    toast({
      title: updated.active ? "Teaching access restored" : "Teaching access deactivated",
      description: profile.full_name,
    });
  };

  const removeProfile = async () => {
    if (!removing) return;
    await base44.entities.TeacherProfile.delete(removing.id);
    setProfiles((current) => current.filter((item) => item.id !== removing.id));
    setRemoving(null);
    toast({ title: "Staff profile removed", description: "The sign-in account itself is unchanged." });
  };

  const profileFor = (email) => profiles.find((profile) => profile.email?.toLowerCase() === email?.toLowerCase());

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Administration"
          title="Restricted area"
          description="Only guidance counselor (admin) accounts can create accounts and manage user roles."
        />
        <div className="surface p-6">
          <p className="text-sm text-foreground">You are signed in as {user?.email || "a teacher account"}.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            You can file incident reports and review the cases you submitted. Ask the guidance counselor if you need a
            change to your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="User management"
        description="Create teacher accounts, assign departments and control who can access student records. There is no public teacher registration."
      >
        <Button className="gap-2" onClick={() => { setError(""); setDialogOpen(true); }}>
          <UserPlus className="h-4 w-4" /> Add teacher
        </Button>
      </PageHeader>

      <section className="surface overflow-hidden">
        <div className="border-b border-border/70 px-5 py-4">
          <h2 className="font-display text-lg text-foreground">Teacher accounts</h2>
          <p className="text-xs text-muted-foreground">
            Deactivating an account blocks the teacher's access the next time they load the system.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                <TableHead>Teacher</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="hidden md:table-cell">Position</TableHead>
                <TableHead>Access</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                    Loading staff accounts…
                  </TableCell>
                </TableRow>
              )}
              {!loading && profileLoadError && (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-xs text-destructive">{profileLoadError}</TableCell></TableRow>
              )}
              {!loading && !profileLoadError && profiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                    No teacher accounts yet. Add one to send an invitation.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{profile.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">{profile.email}</p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{profile.department || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {profile.position || "Teacher"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                          profile.active
                            ? "bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/15 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-400/15 dark:text-slate-300"
                        }`}
                      >
                        {profile.active ? "Active" : "Deactivated"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => toggleActive(profile)}>
                          <Power className="h-3.5 w-3.5" />
                          {profile.active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setRemoving(profile)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="surface overflow-hidden">
        <div className="border-b border-border/70 px-5 py-4">
          <h2 className="font-display text-lg text-foreground">Sign-in accounts</h2>
          <p className="text-xs text-muted-foreground">
            Everyone who has signed in to the system. Only staff with an active teacher account can reach student data.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Staff access</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-xs text-muted-foreground">Loading sign-in accounts…</TableCell></TableRow>
              )}
              {!loading && accountsLoadError && (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-xs text-muted-foreground">{accountsLoadError}</TableCell></TableRow>
              )}
              {!loading && !accountsLoadError && accounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-xs text-muted-foreground">
                    No sign-in accounts yet.
                  </TableCell>
                </TableRow>
              )}
              {accounts.map((account) => {
                const profile = profileFor(account.email);
                return (
                  <TableRow key={account.id}>
                    <TableCell className="text-sm">{account.full_name || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{account.email}</TableCell>
                    <TableCell>
                      {account.id === user?.id ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                          {account.role === "admin" && <ShieldCheck className="h-3 w-3" />}
                          {account.role} (you)
                        </span>
                      ) : (
                        <Select value={account.role} onValueChange={(value) => changeRole(account, value)}>
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Teacher</SelectItem>
                            <SelectItem value="admin">Guidance counselor</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[11px] font-medium ${
                          account.role === "admin" || profile?.active
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {account.role === "admin" ? "Full access" : profile?.active ? "Teacher access" : "No access"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add teacher account</DialogTitle>
            <DialogDescription>
              The teacher receives an invitation email and sets their own password. Their school email address is
              their username.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label className={labelClass}>Full name</Label>
              <Input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
            </div>
            <div>
              <Label className={labelClass}>School email (username)</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="teacher@school.edu.ph"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className={labelClass}>Department</Label>
                <Select value={form.department} onValueChange={(value) => setForm({ ...form, department: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Departments">All departments</SelectItem>
                    {DEPARTMENTS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelClass}>Position</Label>
                <Input value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} />
              </div>
            </div>
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button className="gap-2" onClick={createTeacher} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Send invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove staff profile?"
        description={`${removing?.full_name || "This teacher"} loses teacher access. Their sign-in account and previously filed reports are kept.`}
        confirmLabel="Remove profile"
        onConfirm={removeProfile}
      />

      <p className="text-[11px] text-muted-foreground">
        {isAdmin
          ? "Only guidance counselors can manage accounts. Keep the app's sign-up restricted to invited users."
          : "Only guidance counselors can manage teacher accounts."}
      </p>
    </div>
  );
}