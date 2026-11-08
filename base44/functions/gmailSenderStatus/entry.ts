import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

/**
 * Admin-only: reports which Gmail account currently sends parent notifications.
 * Read-only — never connects, disconnects or modifies the connection.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let accessToken = '';
    try {
      const connection = await base44.asServiceRole.connectors.getConnection('gmail');
      accessToken = connection?.accessToken || '';
    } catch (error) {
      return Response.json({
        connected: false,
        senderEmail: null,
        canSend: false,
        scopes: [],
        error: error?.message || 'No Gmail connection is available.',
      });
    }

    if (!accessToken) {
      return Response.json({
        connected: false,
        senderEmail: null,
        canSend: false,
        scopes: [],
        error: 'No Gmail connection is available.',
      });
    }

    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      return Response.json({
        connected: false,
        senderEmail: null,
        canSend: false,
        scopes: [],
        error: 'The Gmail authorization has expired and needs to be renewed.',
      });
    }

    const info = await response.json();
    const scopes = String(info.scope || '').split(' ').filter(Boolean);

    return Response.json({
      connected: true,
      senderEmail: info.email || null,
      emailVerified: info.verified_email === true,
      scopes,
      canSend: scopes.includes('https://www.googleapis.com/auth/gmail.send'),
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({
      connected: false,
      senderEmail: null,
      canSend: false,
      scopes: [],
      error: error.message,
    });
  }
}