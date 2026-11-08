import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import nodemailer from 'npm:nodemailer@6.9.16';

/**
 * Admin-only parent / guardian email notification for high-alert incidents.
 * Every attempt is recorded in ParentNotification (recipient, case, sender, delivery status).
 *
 * POST body:
 *   { incident_id, recipient_email, recipient_name, resend }
 */

const HIGH_ALERT = ['High', 'Critical'];
const ATTACHABLE = ['pdf', 'png', 'jpg', 'jpeg', 'docx', 'xlsx', 'csv', 'txt', 'md', 'gif', 'webp'];
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

const esc = (value) =>
  String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toBase64 = (bytes) => {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
};

const base64Url = (value) => value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Sends the message through the Gmail API using the connected school account. */
const sendViaGmail = async (base44, { to, subject, html, text, attachments }) => {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'crlf' });
  const info = await transport.sendMail({ to, subject, html, text, attachments });
  const raw = base64Url(toBase64(new Uint8Array(info.message)));

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
    signal: AbortSignal.timeout(20000),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || `Gmail rejected the message (status ${response.status}).`);
  }
  return payload.id;
};

/** Downloads the case attachments so they can be embedded in the email. */
const loadAttachments = async (base44, files) => {
  const ready = [];
  for (const file of files) {
    try {
      const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: file.file_uri,
        expires_in: 300,
      });
      const response = await fetch(signed_url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) continue;
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > MAX_ATTACHMENT_BYTES) continue;
      ready.push({ filename: file.file_name, content: toBase64(bytes), encoding: 'base64' });
    } catch {
      // A single unreadable file must not block the notification.
    }
  }
  return ready;
};

const fmtDate = (value) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const fmtDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
};

const buildMessage = ({ report, settings, recipientName, guardianName, urgencyLabel, accent }) => {
  const schoolName = settings?.school_name || 'the school';
  const officeName = settings?.office_name || 'Guidance Office';
  const counselor = settings?.counselor_name || '';
  const principal = settings?.principal_name || '';
  const student = report.student_name || 'your child';
  const greeting = recipientName || guardianName || 'Parent / Guardian';

  const rows = [
    ['Student', `${report.student_name || '—'}${report.student_number ? ` (${report.student_number})` : ''}`],
    ['Case number', report.case_number || '—'],
    ['Date of incident', fmtDate(report.incident_date)],
    ['Time of incident', report.incident_time || 'Not recorded'],
    ['Location', report.location || 'Not recorded'],
    ['Class', `${report.department || ''} ${report.grade_level || ''} ${report.section || ''}`.trim() || '—'],
    ['Category', report.category || '—'],
    ['Urgency level', urgencyLabel],
    ['Reported by', report.reported_by_name || '—'],
  ];

  const subject = `[${report.severity.toUpperCase()} ALERT] Incident notice for ${student} — ${report.case_number || ''}`.trim();

  const html = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#eef2f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #dbe3ee;">
            <tr>
              <td style="background:#1e2a4a;padding:20px 28px;">
                <p style="margin:0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#a9b8d8;">${esc(schoolName)}</p>
                <p style="margin:6px 0 0;font-size:19px;font-weight:600;color:#ffffff;">Student Incident Notice</p>
              </td>
            </tr>
            <tr>
              <td style="background:${accent};padding:12px 28px;">
                <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#ffffff;">${esc(urgencyLabel)} — please read promptly</p>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 28px 8px;">
                <p style="margin:0 0 14px;font-size:14px;line-height:1.65;">Dear ${esc(greeting)},</p>
                <p style="margin:0 0 14px;font-size:14px;line-height:1.65;">
                  We are writing to inform you about a serious incident involving ${esc(student)} that took place on
                  <strong>${esc(fmtDate(report.incident_date))}</strong>${report.incident_time ? ` at <strong>${esc(report.incident_time)}</strong>` : ''}.
                  Because this case has been classified as a <strong>${esc(report.severity.toLowerCase())}-level alert</strong>,
                  we are notifying you immediately rather than waiting for the written report to reach you.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3e9f2;border-radius:10px;margin:0 0 18px;">
                  ${rows
                    .map(
                      ([label, value], index) => `<tr style="background:${index % 2 === 0 ? '#f8fafc' : '#ffffff'};">
                        <td style="padding:9px 14px;font-size:12px;color:#64748b;width:38%;">${esc(label)}</td>
                        <td style="padding:9px 14px;font-size:13px;font-weight:600;color:#1f2937;">${esc(value)}</td>
                      </tr>`
                    )
                    .join('')}
                </table>
                <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">What happened</p>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.7;white-space:pre-line;">${esc(report.description || 'Details are recorded in the school incident report.')}</p>
                ${
                  report.action_taken
                    ? `<p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">Action already taken by the school</p>
                       <p style="margin:0 0 16px;font-size:14px;line-height:1.7;white-space:pre-line;">${esc(report.action_taken)}</p>`
                    : ''
                }
                <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">What we ask of you</p>
                <p style="margin:0 0 18px;font-size:14px;line-height:1.7;">
                  Please contact the ${esc(officeName)} as soon as possible so we can discuss this incident, the support
                  available for ${esc(student)}, and any follow-up steps. If the matter is urgent outside office hours,
                  please call the school directly.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;border-radius:10px;border:1px solid #e3e9f2;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">School contact</p>
                      <p style="margin:0;font-size:13px;line-height:1.7;color:#1f2937;">
                        <strong>${esc(schoolName)}</strong><br />
                        ${settings?.school_address ? `${esc(settings.school_address)}<br />` : ''}
                        ${esc(officeName)}${counselor ? ` · ${esc(counselor)}` : ''}<br />
                        ${principal ? `School Principal: ${esc(principal)}` : ''}
                      </p>
                    </td>
                  </tr>
                </table>
                <p style="margin:18px 0 4px;font-size:13px;line-height:1.7;">Thank you for your partnership in keeping our students safe.</p>
                <p style="margin:0 0 4px;font-size:13px;line-height:1.7;">Sincerely,<br /><strong>${esc(counselor || officeName)}</strong><br />${esc(schoolName)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 24px;">
                <p style="margin:0;font-size:11px;line-height:1.6;color:#94a3b8;">
                  ${esc(settings?.report_footer || `This notice refers to incident case ${report.case_number || ''} and was sent from the ${officeName}.`)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `${urgencyLabel} — ${schoolName}`,
    '',
    `Dear ${greeting},`,
    '',
    `We are writing to inform you about a serious incident involving ${student} on ${fmtDate(report.incident_date)}${report.incident_time ? ` at ${report.incident_time}` : ''}.`,
    `Severity: ${urgencyLabel}`,
    `Case number: ${report.case_number || '—'}`,
    `Location: ${report.location || 'Not recorded'}`,
    `Category: ${report.category || '—'}`,
    '',
    'What happened:',
    report.description || 'Details are recorded in the school incident report.',
    report.action_taken ? `\nAction already taken by the school:\n${report.action_taken}` : '',
    '',
    `Please contact the ${officeName} as soon as possible so we can discuss this incident and the support available for ${student}.`,
    '',
    `${schoolName}`,
    settings?.school_address || '',
    `${officeName}${counselor ? ` · ${counselor}` : ''}`,
    principal ? `School Principal: ${principal}` : '',
    '',
    settings?.report_footer || '',
  ]
    .filter((line) => line !== undefined && line !== null)
    .join('\n');

  return { subject, html, text };
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth
      .me()
      .catch((error) => (error?.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json(
        { error: 'Only guidance counselor (admin) accounts can email parents and guardians.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const incidentId = String(body.incident_id || '').trim();
    const recipientEmail = String(body.recipient_email || '').trim().toLowerCase();
    const recipientName = String(body.recipient_name || '').trim();
    const wantsResend = body.resend === true;

    if (!incidentId) {
      return Response.json({ error: 'Choose the incident to notify parents about.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(recipientEmail)) {
      return Response.json({ error: 'Enter a valid parent or guardian email address.' }, { status: 400 });
    }

    const admin = base44.asServiceRole;

    const report = await admin.entities.IncidentReport
      .get(incidentId)
      .catch((error) => (error?.status === 404 ? null : Promise.reject(error)));
    if (!report) return Response.json({ error: 'That incident report no longer exists.' }, { status: 404 });

    if (!HIGH_ALERT.includes(report.severity)) {
      return Response.json(
        {
          error:
            'Parent email notifications are reserved for high-alert incidents (High or Critical severity). This case is not an emergency.',
        },
        { status: 400 }
      );
    }

    const { items: previous } = await admin.entities.ParentNotification.filter(
      { incident_id: incidentId },
      { sort: '-created_date', limit: 20 }
    );
    const lastSent = (previous || []).find((item) => item.status === 'Sent');

    if (lastSent && !wantsResend) {
      return Response.json(
        {
          error: `Parents were already emailed about ${report.case_number} on ${fmtDateTime(lastSent.sent_at || lastSent.created_date)}. Confirm a resend to email them again.`,
          already_sent: true,
          last_notification: lastSent,
        },
        { status: 409 }
      );
    }

    const student = report.student_id
      ? await admin.entities.Student
          .get(report.student_id)
          .catch((error) => (error?.status === 404 ? null : Promise.reject(error)))
      : null;

    const settingsRows = await admin.entities.SchoolSettings.list({ limit: 1 });
    const settings = (Array.isArray(settingsRows) ? settingsRows[0] : settingsRows?.items?.[0]) || null;

    const urgencyLabel = report.severity === 'Critical' ? 'Critical emergency alert' : 'High-alert notice';
    const accent = report.severity === 'Critical' ? '#b91c1c' : '#c2410c';

    const { subject, html, text } = buildMessage({
      report,
      settings,
      recipientName,
      guardianName: student?.guardian_name || '',
      urgencyLabel,
      accent,
    });

    const { items: files } = await admin.entities.IncidentAttachment.filter(
      { incident_id: incidentId },
      { limit: 5 }
    );
    let delivered = false;
    let deliveryError = '';
    let sentAttachments = [];

    const attachmentFiles = (files || [])
      .filter((file) => {
        const extension = String(file.file_name || '').split('.').pop().toLowerCase();
        return file.file_uri && ATTACHABLE.includes(extension) && (file.file_size || 0) <= MAX_ATTACHMENT_BYTES;
      })
      .slice(0, 3);

    const prepared = attachmentFiles.length ? await loadAttachments(base44, attachmentFiles) : [];
    const attempts = prepared.length ? [prepared, []] : [[]];

    for (const batch of attempts) {
      try {
        await sendViaGmail(base44, {
          to: recipientEmail,
          subject,
          html,
          text,
          attachments: batch.length ? batch : undefined,
        });
        delivered = true;
        sentAttachments = batch;
        break;
      } catch (error) {
        deliveryError = error?.message || 'The email could not be delivered.';
      }
    }

    const notification = await admin.entities.ParentNotification.create({
      incident_id: incidentId,
      case_number: report.case_number || '',
      student_id: report.student_id || '',
      student_name: report.student_name || '',
      recipient_name: recipientName || student?.guardian_name || '',
      recipient_email: recipientEmail,
      urgency: report.severity,
      subject,
      sender_name: user.full_name || user.email,
      sender_email: user.email,
      status: delivered ? 'Sent' : 'Failed',
      error: delivered ? '' : deliveryError,
      attachments_sent: sentAttachments.map((item) => item.filename).join(', '),
      is_resend: Boolean(lastSent && wantsResend),
      sent_at: new Date().toISOString(),
    });

    return Response.json({
      notification,
      delivered,
      status: delivered ? 'Sent' : 'Failed',
      error: delivered ? null : deliveryError,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}