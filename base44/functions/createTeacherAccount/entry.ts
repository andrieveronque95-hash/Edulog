import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

/**
 * Admin-only teacher invitations and account management.
 * Invitations use the built-in users API; existing sign-in accounts are never recreated.
 * Creating teacher access does not enumerate the sign-in account directory.
 *
 * POST body:
 *   { action: 'create',        full_name, email, department, position }
 *   { action: 'list_accounts' }
 *   { action: 'update_role',   account_id, role }
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((error) => (error?.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json(
        { error: 'Only guidance counselor (admin) accounts can manage teacher accounts.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'create';
    const admin = base44.asServiceRole;

    const allAccounts = async () => {
      const accounts = await admin.entities.User.list();
      const rows = Array.isArray(accounts) ? accounts : accounts?.items || [];
      return rows;
    };

    if (action === 'list_accounts') {
      const rows = await allAccounts();
      const accounts = rows
        .map((account) => ({
          id: account.id,
          email: account.email,
          full_name: account.full_name,
          role: account.role,
        }))
        .sort((a, b) => String(a.email || '').localeCompare(String(b.email || '')));
      return Response.json({ accounts });
    }

    if (action === 'update_role') {
      const role = String(body.role || '');
      if (!['admin', 'user'].includes(role)) {
        return Response.json({ error: 'Choose either teacher or guidance counselor.' }, { status: 400 });
      }
      const target = (await allAccounts()).find((account) => account.id === body.account_id);
      if (!target) return Response.json({ error: 'That account no longer exists.' }, { status: 404 });
      if (target.id === user.id) {
        return Response.json({ error: 'You cannot change your own role.' }, { status: 400 });
      }
      const updated = await admin.entities.User.update(target.id, { role });
      return Response.json({ account: { id: updated.id, email: updated.email, role: updated.role } });
    }

    if (action !== 'create') {
      return Response.json({ error: 'Unknown account operation.' }, { status: 400 });
    }

    // Look up only the requested email to protect existing administrator accounts.
    const full_name = String(body.full_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const department = String(body.department || 'All Departments');
    const position = String(body.position || 'Subject Teacher').trim() || 'Subject Teacher';

    if (!full_name) return Response.json({ error: "Enter the teacher's full name." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (email === String(user.email || '').toLowerCase()) {
      return Response.json(
        { error: "That is your own signed-in email. Use the teacher's own school email address." },
        { status: 409 }
      );
    }

    const matches = await admin.entities.User.filter({ email }, 'email', 1);
    const existing = matches[0] || null;

    if (existing && existing.role === 'admin') {
      return Response.json(
        { error: `${email} already belongs to a guidance counselor account. Use the teacher's own email address.` },
        { status: 409 }
      );
    }

    let invited = false;
    if (!existing) {
      try {
        // The platform sends or resends the invitation; it manages account registration.
        await base44.users.inviteUser(email, 'user');
        invited = true;
      } catch (inviteError) {
        console.error('Teacher invitation failed', inviteError?.message);
        const status = inviteError?.status || inviteError?.response?.status;
        return Response.json(
          { error: inviteError?.message || 'The invitation could not be sent. Please try again.' },
          { status: status >= 400 && status < 500 ? status : 500 }
        );
      }
    }

    const { items } = await base44.entities.TeacherProfile.filter({ email }, { limit: 1 });
    const existingProfile = items && items[0] ? items[0] : null;

    const profile = existingProfile
      ? await base44.entities.TeacherProfile.update(existingProfile.id, {
          full_name,
          department,
          position,
          active: true,
        })
      : await base44.entities.TeacherProfile.create({
          email,
          full_name,
          department,
          position,
          active: true,
        });

    return Response.json({
      profile,
      invited,
      role: 'user',
      account_id: existing ? existing.id : null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}