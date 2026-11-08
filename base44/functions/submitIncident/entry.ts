import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const SEVERITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["Open", "Under Investigation", "Resolved", "Closed"];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = user.role === "admin";
    if (!isAdmin) {
      const staff = await base44.entities.TeacherProfile.filter(
        { email: user.email, active: true },
        { limit: 1 }
      );
      if (!staff.items?.length) {
        return Response.json({ error: "Your account is not authorized to file incident reports." }, { status: 403 });
      }
    }

    const body = await req.json().catch(() => ({}));
    const {
      student_id,
      incident_date,
      incident_time,
      location,
      category,
      severity,
      status,
      description,
      persons_involved,
      witnesses,
      action_taken,
      remarks,
      attachments,
      teacher_signature,
      guardian_signature,
      principal_signature,
    } = body || {};

    if (!student_id) return Response.json({ error: "Please select a student." }, { status: 400 });
    if (!incident_date) return Response.json({ error: "Incident date is required." }, { status: 400 });
    if (!category) return Response.json({ error: "Incident category is required." }, { status: 400 });
    if (!description || String(description).trim().length < 10) {
      return Response.json(
        { error: "Please provide an incident description of at least 10 characters." },
        { status: 400 }
      );
    }

    const safeSeverity = SEVERITIES.includes(severity) ? severity : "Low";
    const safeStatus = STATUSES.includes(status) ? status : "Open";

    const student = await base44.entities.Student.get(student_id).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!student) return Response.json({ error: "Student record not found." }, { status: 404 });

    // Case numbers must be unique across the whole school, so the sequence is read with the
    // service role: teachers can only read their own reports (RLS), which would repeat numbers.
    const year = new Date(incident_date).getFullYear() || new Date().getFullYear();
    const prefix = `IR-${year}-`;
    const yearTotal = await base44.asServiceRole.entities.IncidentReport.count({
      incident_date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
    });

    let sequence = (yearTotal || 0) + 1;
    let caseNumber = `${prefix}${String(sequence).padStart(4, "0")}`;
    for (let attempt = 0; attempt < 25; attempt += 1) {
      const clash = await base44.asServiceRole.entities.IncidentReport.filter(
        { case_number: caseNumber },
        { limit: 1 }
      );
      if (!clash.items || clash.items.length === 0) break;
      sequence += 1;
      caseNumber = `${prefix}${String(sequence).padStart(4, "0")}`;
    }

    const report = await base44.entities.IncidentReport.create({
      case_number: caseNumber,
      student_id: student.id,
      student_number: student.student_id || "",
      student_name: student.full_name || "",
      grade_level: student.grade_level || "",
      section: student.section || "",
      department: student.department || "",
      incident_date,
      incident_time: incident_time || "",
      location: location || "",
      category,
      severity: safeSeverity,
      status: safeStatus,
      description: String(description).trim(),
      persons_involved: persons_involved || "",
      witnesses: witnesses || "",
      action_taken: action_taken || "",
      remarks: remarks || "",
      reported_by_name: user.full_name || user.email,
      reported_by_email: user.email,
      teacher_signature: teacher_signature || null,
      guardian_signature: guardian_signature || null,
      principal_signature: principal_signature || null,
      attachment_count: Array.isArray(attachments) ? attachments.length : 0,
      is_demo: false,
    });

    const rows = (Array.isArray(attachments) ? attachments : [])
      .filter((item) => item && item.file_uri)
      .slice(0, 10)
      .map((item) => ({
        incident_id: report.id,
        file_name: String(item.file_name || "Attachment").slice(0, 180),
        file_uri: item.file_uri,
        file_type: String(item.file_type || "").slice(0, 100),
        file_size: Number(item.file_size) || 0,
        uploaded_by_name: user.full_name || user.email,
      }));

    if (rows.length) await base44.entities.IncidentAttachment.bulkCreate(rows);

    await base44.entities.IncidentStatusHistory.create({
      incident_id: report.id,
      from_status: "—",
      to_status: safeStatus,
      note: "Incident report submitted",
      changed_by_name: user.full_name || user.email,
      changed_at: new Date().toISOString(),
    });

    if (!isAdmin) {
      const teacherName = user.full_name || user.email;
      try {
        await base44.asServiceRole.entities.Notification.create({
          incident_id: report.id,
          case_number: report.case_number,
          student_name: report.student_name,
          category: report.category,
          severity: report.severity,
          teacher_name: teacherName,
          teacher_email: user.email,
          message: `${teacherName} submitted a new ${report.category} incident report for ${report.student_name}.`,
          submitted_at: new Date().toISOString(),
          read_by: [],
        });
      } catch (notifyError) {
        // The report itself is already saved — a failed notification must not fail the submission.
      }
    }

    return Response.json({ report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}