import { sendEmail } from './email';

// ============================================
// Shared types and logic for service summary emails
// Used by: /api/admin/next-steps/send-summary (manual)
//          /api/cron/follow-ups (auto-send)
// ============================================

export interface ResponseRow {
  response_id: string;
  person_key: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  is_guest: boolean;
  block_type: string;
  response_type: string;
  response_label: string;
  coordinator_email: string | null;
  response_data: Record<string, unknown>;
  responded_at: string;
  service_title: string;
  service_date: string | null;
  session_ended_at: string | null;
}

export interface PersonRecord {
  person_key: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  is_guest: boolean;
  responses: { label: string; block_type: string; response_type: string }[];
  triggerCoordinators: Set<string>;
}

// ============================================
// Build person-centric records from raw response rows
// ============================================
export function buildPersonRecords(rows: ResponseRow[]): Map<string, PersonRecord> {
  const personMap = new Map<string, PersonRecord>();

  for (const r of rows) {
    let person = personMap.get(r.person_key);
    if (!person) {
      person = {
        person_key: r.person_key,
        display_name: r.display_name,
        email: r.email,
        phone: r.phone,
        is_guest: r.is_guest,
        responses: [],
        triggerCoordinators: new Set(),
      };
      personMap.set(r.person_key, person);
    }

    if (r.email && !person.email) person.email = r.email;
    if (r.phone && !person.phone) person.phone = r.phone;

    const alreadyHas = person.responses.some(
      (resp) => resp.label === r.response_label && resp.block_type === r.block_type
    );
    if (!alreadyHas) {
      person.responses.push({
        label: r.response_label,
        block_type: r.block_type,
        response_type: r.response_type,
      });
    }

    if (r.coordinator_email) {
      person.triggerCoordinators.add(r.coordinator_email);
    }
  }

  return personMap;
}

// ============================================
// Build coordinator → person list (person-centric routing)
// ============================================
export function buildCoordinatorMap(personMap: Map<string, PersonRecord>): Map<string, PersonRecord[]> {
  const coordinatorPeople = new Map<string, PersonRecord[]>();

  for (const person of personMap.values()) {
    for (const coordEmail of person.triggerCoordinators) {
      const existing = coordinatorPeople.get(coordEmail) || [];
      existing.push(person);
      coordinatorPeople.set(coordEmail, existing);
    }
  }

  return coordinatorPeople;
}

// ============================================
// Send all coordinator + master summary emails for a session
// Returns { sent, coordinators }
// ============================================
export async function sendServiceSummaryEmails(
  rows: ResponseRow[],
  churchId: string,
  masterSummaryEmail?: string | null
): Promise<{ sent: number; coordinators: string[] }> {
  if (rows.length === 0) {
    return { sent: 0, coordinators: [] };
  }

  const personMap = buildPersonRecords(rows);
  const coordinatorPeople = buildCoordinatorMap(personMap);

  const serviceTitle = rows[0]?.service_title || 'Service';
  const serviceDate = rows[0]?.service_date
    ? new Date(rows[0].service_date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  let sent = 0;
  const coordinators: string[] = [];

  // Send per-coordinator emails with CSV
  for (const [coordEmail, people] of coordinatorPeople) {
    const triggerLabels = new Set<string>();
    for (const r of rows) {
      if (r.coordinator_email === coordEmail) {
        triggerLabels.add(r.response_label);
      }
    }

    const html = buildCoordinatorEmail(serviceTitle, serviceDate, people, triggerLabels);
    const csv = buildPersonCsv(people);

    const result = await sendEmail({
      to: coordEmail,
      subject: `Service Follow-Up — ${serviceTitle}${serviceDate ? ` (${serviceDate})` : ''}`,
      html,
      churchId,
      notificationType: 'service_followup_coordinator',
      attachments: [
        {
          filename: `follow-up-${new Date().toISOString().split('T')[0]}.csv`,
          content: Buffer.from(csv).toString('base64'),
        },
      ],
    });

    if (result.success) {
      sent++;
      coordinators.push(coordEmail);
    }
  }

  // Send master summary to leader (if email provided)
  if (masterSummaryEmail) {
    const allPeople = Array.from(personMap.values());
    const html = buildMasterSummaryEmail(serviceTitle, serviceDate, allPeople, rows);
    const csv = buildPersonCsv(allPeople);

    const result = await sendEmail({
      to: masterSummaryEmail,
      subject: `Service Summary — ${serviceTitle}${serviceDate ? ` (${serviceDate})` : ''}`,
      html,
      churchId,
      notificationType: 'service_followup_summary',
      attachments: [
        {
          filename: `service-summary-${new Date().toISOString().split('T')[0]}.csv`,
          content: Buffer.from(csv).toString('base64'),
        },
      ],
    });
    if (result.success) sent++;
  }

  return { sent, coordinators };
}

// ============================================
// CSV Builder — person-centric
// ============================================
export function buildPersonCsv(people: PersonRecord[]): string {
  const headers = ['Name', 'Email', 'Phone', 'Type', 'Responses'];
  const rows = people.map((p) => [
    p.display_name,
    p.email || '',
    p.phone || '',
    p.is_guest ? 'Guest' : 'Member',
    p.responses.map((r) => r.label).join('; '),
  ]);

  return [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}

// ============================================
// HTML Helpers
// ============================================
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildPersonTable(people: PersonRecord[]): string {
  const rows = people
    .map(
      (p) => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 14px;">
        ${escapeHtml(p.display_name)}
        ${p.is_guest ? '<span style="color: #b45309; font-size: 11px; margin-left: 4px;">(Guest)</span>' : ''}
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 14px; color: #5A6577;">
        ${p.email ? escapeHtml(p.email) : '—'}
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 14px; color: #5A6577;">
        ${p.phone ? escapeHtml(p.phone) : '—'}
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px;">
        ${p.responses.map((r) => `<span style="display:inline-block;background:#eff6ff;color:#1d4ed8;padding:2px 8px;border-radius:10px;font-size:12px;margin:2px;">${escapeHtml(r.label)}</span>`).join(' ')}
      </td>
    </tr>`
    )
    .join('');

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
      <thead>
        <tr style="background: #f8f9fa;">
          <th style="text-align: left; padding: 8px 12px; font-size: 12px; color: #5A6577; font-weight: 600;">Name</th>
          <th style="text-align: left; padding: 8px 12px; font-size: 12px; color: #5A6577; font-weight: 600;">Email</th>
          <th style="text-align: left; padding: 8px 12px; font-size: 12px; color: #5A6577; font-weight: 600;">Phone</th>
          <th style="text-align: left; padding: 8px 12px; font-size: 12px; color: #5A6577; font-weight: 600;">All Responses</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ============================================
// Coordinator Email — person-centric
// ============================================
function buildCoordinatorEmail(
  serviceTitle: string,
  serviceDate: string,
  people: PersonRecord[],
  triggerLabels: Set<string>
): string {
  const labelList = Array.from(triggerLabels).map((l) => escapeHtml(l)).join(', ');

  return `
    <div style="font-family: system-ui, sans-serif; max-width: 640px; margin: 0 auto;">
      <div style="background: #1A2332; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">Service Follow-Up</h2>
        <p style="margin: 6px 0 0 0; opacity: 0.8; font-size: 14px;">
          ${escapeHtml(serviceTitle)}${serviceDate ? ` — ${serviceDate}` : ''}
        </p>
      </div>

      <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 14px; margin: 0 0 8px 0;">
          You&apos;re receiving this because <strong>${people.length} ${people.length === 1 ? 'person' : 'people'}</strong>
          responded to: <strong>${labelList}</strong>
        </p>
        <p style="color: #6b7280; font-size: 13px; margin: 0 0 16px 0;">
          Each person&apos;s complete response set is shown below so you have full context. A CSV is attached.
        </p>

        ${buildPersonTable(people)}

        <p style="color: #9ca3af; font-size: 12px; margin: 24px 0 0 0; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          Sent from DNA Discipleship — Church React
        </p>
      </div>
    </div>`;
}

// ============================================
// Master Summary Email — all people, all responses
// ============================================
function buildMasterSummaryEmail(
  serviceTitle: string,
  serviceDate: string,
  people: PersonRecord[],
  rows: ResponseRow[]
): string {
  const coordSet = new Set<string>();
  for (const r of rows) {
    if (r.coordinator_email) coordSet.add(r.coordinator_email);
  }

  const labelCounts: Record<string, number> = {};
  for (const r of rows) {
    labelCounts[r.response_label] = (labelCounts[r.response_label] || 0) + 1;
  }

  const breakdownHtml = Object.entries(labelCounts)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([label, count]) =>
        `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:14px;"><span>${escapeHtml(label)}</span><strong>${count}</strong></div>`
    )
    .join('');

  return `
    <div style="font-family: system-ui, sans-serif; max-width: 640px; margin: 0 auto;">
      <div style="background: #1A2332; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">Service Summary — All Responses</h2>
        <p style="margin: 6px 0 0 0; opacity: 0.8; font-size: 14px;">
          ${escapeHtml(serviceTitle)}${serviceDate ? ` — ${serviceDate}` : ''}
        </p>
      </div>

      <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 14px; margin: 0 0 16px 0;">
          <strong>${people.length} ${people.length === 1 ? 'person' : 'people'}</strong> responded across
          <strong>${Object.keys(labelCounts).length} categor${Object.keys(labelCounts).length !== 1 ? 'ies' : 'y'}</strong>.
          ${coordSet.size > 0 ? `Emails were sent to <strong>${coordSet.size} coordinator${coordSet.size !== 1 ? 's' : ''}</strong>.` : ''}
        </p>

        <div style="background: #f8f9fa; padding: 12px 16px; border-radius: 6px; margin: 0 0 20px 0;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #374151;">Response Breakdown</h3>
          ${breakdownHtml}
        </div>

        ${buildPersonTable(people)}

        <p style="color: #9ca3af; font-size: 12px; margin: 24px 0 0 0; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          Sent from DNA Discipleship — Church React
        </p>
      </div>
    </div>`;
}
