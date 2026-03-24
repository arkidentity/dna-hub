import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const { to, churchName, name, email, phone } = await request.json();

  if (!to || !name || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const html = `
    <h2>New Mentorship Interest</h2>
    <p>Someone from the <strong>${churchName}</strong> app is interested in mentorship:</p>
    <table cellpadding="6" style="border-collapse:collapse;">
      <tr><td><strong>Name</strong></td><td>${name}</td></tr>
      <tr><td><strong>Email</strong></td><td>${email}</td></tr>
      ${phone ? `<tr><td><strong>Phone</strong></td><td>${phone}</td></tr>` : ''}
    </table>
    <p>They submitted this request through the DNA Pathway app.</p>
  `;

  const result = await sendEmail({
    to,
    subject: `Mentorship Interest from ${name}`,
    html,
    notificationType: 'mentorship_request',
  });

  if (!result.success) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
