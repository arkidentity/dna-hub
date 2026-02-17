import { Resend } from 'resend';
import { getSupabaseAdmin } from './auth';

const FROM_EMAIL = 'DNA Discipleship <notifications@mail.dnadiscipleship.com>';
const REPLY_TO = 'info@dnadiscipleship.com';
const TRAVIS_EMAIL = 'info@dnadiscipleship.com';

// Calendar URLs - configured in .env.local
const DISCOVERY_CALL_URL = process.env.DISCOVERY_CALENDAR_URL || 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0LdUpKkvo_qoOrtiu6fQfPgkQJUZaG9RxPtYVieJrl1RAFnUmgTN9WATs6jAxSbkdo5M4-bpfI?gv=true';
const PROPOSAL_CALL_URL = process.env.PROPOSAL_CALENDAR_URL || 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1E8bA8sb4SP7QBJw45-6zKwxVNFu6x7w4YMBABJ1qdiE9ALT7hGvOlJ2RUGcfV9LwopqFiGPGe?gv=true';
const STRATEGY_CALL_URL = process.env.STRATEGY_CALENDAR_URL || 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ06-H6-Lu-ReUlLa7bTB0qgXj9c1DxocZWH7WxTLw__s9chlLMDflEtH_my63oqNrQAaV7oahqR?gv=true';

// Create Resend client lazily
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  // Optional: for logging to notification_log
  churchId?: string;
  notificationType?: string;
}

async function sendEmail({ to, subject, html, churchId, notificationType }: EmailOptions) {
  const resend = getResend();

  if (!resend) {
    console.log('[EMAIL] No RESEND_API_KEY found - running in DEV MODE');
    console.log('[EMAIL - DEV MODE]', { to, subject });
    return { success: true, dev: true };
  }

  console.log('[EMAIL] Sending email via Resend:', { from: FROM_EMAIL, to, subject });

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      replyTo: REPLY_TO,
    });

    if (error) {
      console.error('[EMAIL] Resend API error:', JSON.stringify(error));
      return { success: false, error };
    }

    console.log('[EMAIL] Successfully sent, ID:', data?.id);

    // Log to notification_log for audit trail
    if (notificationType) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        await supabaseAdmin.from('notification_log').insert({
          church_id: churchId || null,
          notification_type: notificationType,
          sent_to: to,
          subject: subject,
          sent_at: new Date().toISOString(),
        });
      } catch (logError) {
        console.error('[EMAIL] Failed to log notification:', logError);
        // Don't fail the email send if logging fails
      }
    }

    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('[EMAIL] Exception during send:', error);
    return { success: false, error };
  }
}

// Notification: New assessment submitted
export async function sendAssessmentNotification(
  churchName: string,
  contactName: string,
  contactEmail: string,
  churchId?: string
) {
  const subject = `New DNA Assessment: ${churchName}`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">New Church Assessment Submitted</h2>

      <div style="background: #F4E7D7; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Church:</strong> ${churchName}</p>
        <p style="margin: 0 0 10px 0;"><strong>Contact:</strong> ${contactName}</p>
        <p style="margin: 0;"><strong>Email:</strong> ${contactEmail}</p>
      </div>

      <p>Review their assessment and schedule a strategy call.</p>

      <p style="color: #5A6577; font-size: 14px; margin-top: 30px;">
        — DNA Church Hub
      </p>
    </div>
  `;

  return sendEmail({
    to: TRAVIS_EMAIL,
    subject,
    html,
    churchId,
    notificationType: 'assessment_notification'
  });
}

// Notification: Key milestone completed
export async function sendMilestoneNotification(
  churchName: string,
  milestoneName: string,
  phaseName: string,
  completedBy: string,
  churchId?: string
) {
  const subject = `🎉 ${churchName} - Milestone Completed`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Key Milestone Completed!</h2>

      <div style="background: #F4E7D7; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Church:</strong> ${churchName}</p>
        <p style="margin: 0 0 10px 0;"><strong>Phase:</strong> ${phaseName}</p>
        <p style="margin: 0 0 10px 0;"><strong>Milestone:</strong> ${milestoneName}</p>
        <p style="margin: 0;"><strong>Completed by:</strong> ${completedBy}</p>
      </div>

      <p>Consider reaching out to celebrate and encourage them!</p>

      <p style="color: #5A6577; font-size: 14px; margin-top: 30px;">
        — DNA Church Hub
      </p>
    </div>
  `;

  return sendEmail({
    to: TRAVIS_EMAIL,
    subject,
    html,
    churchId,
    notificationType: 'milestone_completed'
  });
}

// Notification: Phase completed
export async function sendPhaseCompletionNotification(
  churchName: string,
  phaseNumber: number,
  phaseName: string,
  churchId?: string
) {
  const subject = `🏆 ${churchName} - Phase ${phaseNumber} Complete!`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Phase ${phaseNumber} Completed!</h2>

      <div style="background: #4A9E7F; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-size: 18px;"><strong>${churchName}</strong></p>
        <p style="margin: 0;">Has completed <strong>${phaseName}</strong></p>
      </div>

      <p>They've unlocked Phase ${phaseNumber + 1} and are ready to continue their DNA journey.</p>

      <p>This is a great time to check in and celebrate their progress!</p>

      <p style="color: #5A6577; font-size: 14px; margin-top: 30px;">
        — DNA Church Hub
      </p>
    </div>
  `;

  return sendEmail({
    to: TRAVIS_EMAIL,
    subject,
    html,
    churchId,
    notificationType: 'phase_completed'
  });
}

// Magic link email
export async function sendMagicLinkEmail(
  to: string,
  name: string,
  magicLink: string
) {
  const subject = 'Your DNA Dashboard Login Link';
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Hi ${name},</h2>

      <p>Click the button below to access your DNA Church Dashboard:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${magicLink}"
           style="background: #D4A853; color: white; padding: 16px 32px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          Access Dashboard
        </a>
      </div>

      <p style="color: #5A6577; font-size: 14px;">
        This link expires in 7 days. If you didn't request this, you can safely ignore this email.
      </p>

      <p style="color: #5A6577; font-size: 14px;">
        Or copy this link: <br>
        <a href="${magicLink}" style="color: #2D6A6A;">${magicLink}</a>
      </p>

      <p style="color: #5A6577; font-size: 14px; margin-top: 30px;">
        — DNA Church Hub
      </p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// DNA Manual delivery email
export async function sendDNAManualEmail(to: string, firstName: string) {
  const manualUrl = process.env.DNA_MANUAL_URL || 'https://dnadiscipleship.com/dna-manual.pdf';
  const assessmentUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/assessment`
    : 'https://dnadiscipleship.com/assessment';

  const subject = `${firstName}, here's the DNA Multiplication Manual`;
  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 580px; margin: 0 auto; background: #f7f4ef; color: #0f0e0c;">

      <!-- Header bar -->
      <div style="background: #1A2332; padding: 20px 32px; display: flex; align-items: center;">
        <span style="font-family: system-ui, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #D4A853;">DNA Discipleship</span>
      </div>

      <!-- Body -->
      <div style="padding: 40px 32px; background: #fdfbf7;">

        <p style="font-family: system-ui, sans-serif; font-size: 16px; line-height: 1.6; color: #0f0e0c; margin: 0 0 20px 0;">
          Hey ${firstName},
        </p>

        <p style="font-family: system-ui, sans-serif; font-size: 16px; line-height: 1.6; color: #6b6560; margin: 0 0 32px 0;">
          The Multiplication Manual is attached below. Six sessions. Forty-nine pages. The biblical case and the practical framework for moving your church from <em>wanting</em> to make disciples to actually doing it — reproducibly.
        </p>

        <!-- Download CTA -->
        <div style="background: #1A2332; padding: 28px 32px; margin: 0 0 32px 0; text-align: center;">
          <p style="font-family: system-ui, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #D4A853; margin: 0 0 12px 0;">Free Download</p>
          <p style="font-family: Georgia, serif; font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 6px 0;">DNA Multiplication Manual</p>
          <p style="font-family: system-ui, sans-serif; font-size: 13px; color: rgba(255,255,255,0.45); margin: 0 0 20px 0;">6 sessions &middot; 49 pages</p>
          <a href="${manualUrl}"
             style="background: #D4A853; color: #0f0e0c; padding: 14px 28px;
                    text-decoration: none; font-family: system-ui, sans-serif;
                    font-size: 14px; font-weight: 600; letter-spacing: 0.04em;
                    display: inline-block;">
            Download the Manual (PDF)
          </a>
        </div>

        <!-- What's inside -->
        <p style="font-family: system-ui, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #D4A853; margin: 0 0 12px 0;">What's inside</p>
        <ul style="list-style: none; padding: 0; margin: 0 0 32px 0;">
          ${[
            'The biblical case for multiplication — not just addition',
            'The complete 3-phase DNA process explained',
            'How to identify and invite the right disciples',
            'What makes a disciple actually ready to multiply',
            'The most common mistakes — and how to avoid them',
            'How to cast vision for multiplication in your church',
          ].map(item => `
          <li style="font-family: system-ui, sans-serif; font-size: 14px; color: #6b6560; padding: 8px 0; border-bottom: 1px solid #ddd8cf; display: flex; gap: 10px; align-items: flex-start;">
            <span style="color: #D4A853; font-weight: 700; flex-shrink: 0;">→</span> ${item}
          </li>`).join('')}
        </ul>

        <hr style="border: none; border-top: 1px solid #ddd8cf; margin: 32px 0;" />

        <!-- Assessment nudge -->
        <p style="font-family: Georgia, serif; font-size: 18px; font-weight: 700; color: #0f0e0c; margin: 0 0 10px 0;">
          While you read — one question worth asking:
        </p>
        <p style="font-family: system-ui, sans-serif; font-size: 15px; line-height: 1.7; color: #6b6560; margin: 0 0 20px 0;">
          Does your church have the infrastructure to actually launch this? The Church Readiness Assessment takes 5 minutes and tells you honestly where you stand — and what to address before you try.
        </p>
        <a href="${assessmentUrl}"
           style="background: #1A2332; color: #fff; padding: 12px 24px;
                  text-decoration: none; font-family: system-ui, sans-serif;
                  font-size: 13px; font-weight: 500; letter-spacing: 0.03em;
                  display: inline-block;">
          Take the Church Readiness Assessment →
        </a>

        <p style="font-family: system-ui, sans-serif; font-size: 15px; line-height: 1.6; color: #0f0e0c; margin: 40px 0 4px 0;">
          Travis
        </p>
        <p style="font-family: system-ui, sans-serif; font-size: 13px; color: #6b6560; margin: 0;">
          DNA Discipleship
        </p>

        <p style="font-family: system-ui, sans-serif; font-size: 13px; color: #6b6560; margin: 24px 0 0 0; padding-top: 24px; border-top: 1px solid #ddd8cf;">
          P.S. Have questions? Hit reply. I read every email.
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #2a2825; padding: 16px 32px; text-align: center;">
        <p style="font-family: system-ui, sans-serif; font-size: 11px; color: rgba(247,244,239,0.35); margin: 0;">
          DNA Discipleship &middot; dnadiscipleship.com
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// Status change notification emails to church leaders

// Sent when admin moves church to 'proposal_sent' - after discovery call
export async function sendProposalReadyEmail(
  to: string,
  firstName: string,
  churchName: string,
  portalUrl: string,
  churchId?: string
) {
  // Proposal Review Call (30 min) - uses env var defined at top of file
  const proposalCallUrl = PROPOSAL_CALL_URL;

  const subject = `Your DNA Proposal is Ready - ${churchName}`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Hey ${firstName},</h2>

      <p>Great news! Following our discovery call, I've put together a customized DNA implementation proposal for ${churchName}.</p>

      <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <h3 style="color: #1A2332; margin: 0 0 12px 0;">Your Proposal is Ready</h3>
        <p style="margin: 0 0 16px 0;">View your proposal and all your discovery notes in your portal:</p>
        <a href="${portalUrl}"
           style="background: #D4A853; color: white; padding: 14px 28px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          View Your Portal
        </a>
      </div>

      <h3 style="color: #1A2332;">Next Step: Proposal Review Call</h3>
      <p>Book a 30-minute call to walk through the proposal together. I'll answer any questions and we can discuss which tier makes the most sense for ${churchName}.</p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${proposalCallUrl}"
           style="background: #2D6A6A; color: white; padding: 14px 28px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          Book Proposal Review Call (30 min)
        </a>
      </div>

      <p style="margin-top: 32px;">Travis<br>
      <span style="color: #5A6577;">DNA Discipleship</span></p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    churchId,
    notificationType: 'proposal_ready'
  });
}

// Sent when admin moves church to 'awaiting_strategy' - after agreement
export async function sendAgreementConfirmedEmail(
  to: string,
  firstName: string,
  churchName: string,
  tierName: string,
  portalUrl: string,
  churchId?: string
) {
  // Strategy Call (60 min) - uses env var defined at top of file
  const strategyCallUrl = STRATEGY_CALL_URL;

  const subject = `Welcome to DNA! - ${churchName}`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Hey ${firstName}!</h2>

      <div style="background: #4A9E7F; color: white; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
        <h3 style="margin: 0 0 8px 0;">Welcome to DNA!</h3>
        <p style="margin: 0; font-size: 18px;">${churchName} is now part of the DNA family</p>
      </div>

      <p>I'm excited to partner with you on this journey. You've chosen the <strong>${tierName}</strong> tier, and I can't wait to see how God uses DNA at ${churchName}.</p>

      <h3 style="color: #1A2332;">Your Agreement</h3>
      <p>Your signed agreement and all documents are available in your portal:</p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${portalUrl}"
           style="background: #D4A853; color: white; padding: 14px 28px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          View Your Portal
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />

      <h3 style="color: #1A2332;">Final Step: Strategy Call</h3>
      <p>Let's schedule a 60-minute strategy call to:</p>
      <ul style="color: #5A6577;">
        <li>Create your customized implementation timeline</li>
        <li>Identify your first DNA group leaders</li>
        <li>Set you up with full dashboard access</li>
        <li>Answer any final questions</li>
      </ul>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${strategyCallUrl}"
           style="background: #2D6A6A; color: white; padding: 14px 28px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          Book Strategy Call (60 min)
        </a>
      </div>

      <p style="margin-top: 32px;">Travis<br>
      <span style="color: #5A6577;">DNA Discipleship</span></p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    churchId,
    notificationType: 'agreement_confirmed'
  });
}

// Sent when admin moves church to 'active' - after strategy call, full dashboard access
export async function sendDashboardAccessEmail(
  to: string,
  firstName: string,
  churchName: string,
  dashboardUrl: string,
  churchId?: string
) {
  const subject = `Your DNA Dashboard is Live! - ${churchName}`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Hey ${firstName}!</h2>

      <div style="background: #1A2332; color: white; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
        <h3 style="color: #D4A853; margin: 0 0 8px 0;">Your Dashboard is Live!</h3>
        <p style="margin: 0;">Full access to ${churchName}'s DNA implementation hub</p>
      </div>

      <p>Following our strategy call, you now have full access to your DNA Dashboard. This is your home base for the entire implementation journey.</p>

      <h3 style="color: #1A2332;">What You Can Do:</h3>
      <ul style="color: #5A6577;">
        <li><strong>Track Progress</strong> - See your journey through all 5 phases</li>
        <li><strong>Access Resources</strong> - Download materials for each milestone</li>
        <li><strong>Mark Milestones</strong> - Check off completed items as you go</li>
        <li><strong>Upload Documents</strong> - Store your church's DNA documents</li>
        <li><strong>Export Calendar</strong> - Add milestones to your calendar</li>
      </ul>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${dashboardUrl}"
           style="background: #D4A853; color: white; padding: 16px 32px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block; font-size: 18px;">
          Access Your Dashboard
        </a>
      </div>

      <p style="background: #F4E7D7; padding: 16px; border-radius: 8px;">
        <strong>Bookmark this link</strong> - You can always request a new login link from the login page, but bookmarking makes access easy.
      </p>

      <p style="margin-top: 32px;">Let's multiply disciples together!</p>

      <p>Travis<br>
      <span style="color: #5A6577;">DNA Discipleship</span></p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    churchId,
    notificationType: 'dashboard_access'
  });
}

// =====================================================
// FOLLOW-UP / REMINDER EMAILS
// =====================================================

// Reminder: Book your discovery call (3 days after assessment)
export async function sendBookDiscoveryReminder(
  to: string,
  firstName: string,
  churchName: string,
  churchId?: string
) {
  const discoveryCallUrl = DISCOVERY_CALL_URL;

  const subject = `${firstName}, let's schedule your Discovery Call`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Hey ${firstName},</h2>

      <p>A few days ago, you completed the DNA Church Assessment for ${churchName}. I noticed you haven't booked your Discovery Call yet.</p>

      <p>This is a quick 15-minute conversation where we'll:</p>
      <ul style="color: #5A6577;">
        <li>Discuss your assessment results</li>
        <li>Answer any questions you have about DNA</li>
        <li>Explore if DNA is the right fit for ${churchName}</li>
      </ul>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${discoveryCallUrl}"
           style="background: #D4A853; color: white; padding: 16px 32px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          Book Your Discovery Call (15 min)
        </a>
      </div>

      <p style="color: #5A6577;">No pressure—just a friendly conversation to see if we're a good fit to partner together.</p>

      <p style="margin-top: 32px;">Travis<br>
      <span style="color: #5A6577;">DNA Discipleship</span></p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    churchId,
    notificationType: 'book_discovery_reminder'
  });
}

// Reminder: Call in 24 hours
export async function sendCallReminder24h(
  to: string,
  firstName: string,
  churchName: string,
  callType: 'discovery' | 'proposal' | 'strategy',
  scheduledAt: Date,
  churchId?: string
) {
  const callTypeNames = {
    discovery: 'Discovery Call',
    proposal: 'Proposal Review Call',
    strategy: 'Strategy Call'
  };

  const callDurations = {
    discovery: '15 minutes',
    proposal: '30 minutes',
    strategy: '60 minutes'
  };

  const callName = callTypeNames[callType];
  const duration = callDurations[callType];

  // Format the date nicely
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  };
  const formattedDate = scheduledAt.toLocaleDateString('en-US', options);

  const subject = `Reminder: ${callName} Tomorrow - ${churchName}`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Hey ${firstName},</h2>

      <p>Just a friendly reminder that we have a call scheduled!</p>

      <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <h3 style="color: #1A2332; margin: 0 0 12px 0;">${callName}</h3>
        <p style="margin: 0 0 8px 0;"><strong>When:</strong> ${formattedDate}</p>
        <p style="margin: 0 0 8px 0;"><strong>Duration:</strong> ${duration}</p>
        <p style="margin: 0;"><strong>Church:</strong> ${churchName}</p>
      </div>

      <p>Looking forward to connecting with you!</p>

      <p style="color: #5A6577; font-size: 14px; margin-top: 24px;">
        Need to reschedule? Just reply to this email and we'll find a new time.
      </p>

      <p style="margin-top: 32px;">Travis<br>
      <span style="color: #5A6577;">DNA Discipleship</span></p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    churchId,
    notificationType: 'call_reminder_24h'
  });
}

// Notification: Missed call
export async function sendCallMissedEmail(
  to: string,
  firstName: string,
  churchName: string,
  callType: 'discovery' | 'proposal' | 'strategy',
  churchId?: string
) {
  const callTypeNames = {
    discovery: 'Discovery Call',
    proposal: 'Proposal Review Call',
    strategy: 'Strategy Call'
  };

  const rescheduleUrls = {
    discovery: DISCOVERY_CALL_URL,
    proposal: PROPOSAL_CALL_URL,
    strategy: STRATEGY_CALL_URL
  };

  const callName = callTypeNames[callType];
  const rescheduleUrl = rescheduleUrls[callType];

  const subject = `We missed you! Let's reschedule - ${churchName}`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Hey ${firstName},</h2>

      <p>I noticed we weren't able to connect for our ${callName} yesterday. No worries—I know things come up!</p>

      <p>Let's find a new time that works better for you:</p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${rescheduleUrl}"
           style="background: #D4A853; color: white; padding: 16px 32px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          Reschedule ${callName}
        </a>
      </div>

      <p style="color: #5A6577;">If your schedule has changed and you need more flexibility, just reply to this email and we'll work something out.</p>

      <p style="margin-top: 32px;">Travis<br>
      <span style="color: #5A6577;">DNA Discipleship</span></p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    churchId,
    notificationType: 'call_missed'
  });
}

// Reminder: Proposal expiring (7 days after proposal sent)
export async function sendProposalExpiringEmail(
  to: string,
  firstName: string,
  churchName: string,
  portalUrl: string,
  churchId?: string
) {
  const proposalCallUrl = PROPOSAL_CALL_URL;

  const subject = `Your DNA Proposal - Next Steps? - ${churchName}`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Hey ${firstName},</h2>

      <p>I sent over the DNA implementation proposal for ${churchName} about a week ago. I wanted to check in and see if you've had a chance to review it.</p>

      <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <h3 style="color: #1A2332; margin: 0 0 12px 0;">Your Proposal is Waiting</h3>
        <p style="margin: 0 0 16px 0;">View your customized proposal and all discovery notes in your portal:</p>
        <a href="${portalUrl}"
           style="background: #2D6A6A; color: white; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          View Proposal
        </a>
      </div>

      <p>Have questions? Let's hop on a quick call to walk through it together:</p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${proposalCallUrl}"
           style="background: #D4A853; color: white; padding: 14px 28px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          Book Proposal Review Call (30 min)
        </a>
      </div>

      <p style="color: #5A6577;">If DNA isn't the right fit right now, no worries at all. Just let me know and I'll keep you in the loop for future resources.</p>

      <p style="margin-top: 32px;">Travis<br>
      <span style="color: #5A6577;">DNA Discipleship</span></p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    churchId,
    notificationType: 'proposal_expiring'
  });
}

// Reminder: Inactive church (14 days with no progress)
export async function sendInactiveReminderEmail(
  to: string,
  firstName: string,
  churchName: string,
  currentPhase: number,
  dashboardUrl: string,
  churchId?: string
) {
  const phaseNames: Record<number, string> = {
    0: 'Onboarding',
    1: 'Church Partnership',
    2: 'Leader Preparation',
    3: 'DNA Foundation',
    4: 'Practical Preparation',
    5: 'Final Validation & Launch'
  };

  const phaseName = phaseNames[currentPhase] || `Phase ${currentPhase}`;

  const subject = `Checking in on ${churchName}'s DNA Journey`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Hey ${firstName},</h2>

      <p>I noticed it's been a couple weeks since we've seen activity on ${churchName}'s DNA dashboard. Just wanted to check in and see how things are going!</p>

      <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <h3 style="color: #1A2332; margin: 0 0 8px 0;">Current Status</h3>
        <p style="margin: 0; color: #5A6577;">${churchName} is in <strong>${phaseName}</strong></p>
      </div>

      <p>Is there anything I can help with? Common reasons churches pause:</p>
      <ul style="color: #5A6577;">
        <li>Busy season at church (totally understandable!)</li>
        <li>Questions about next steps</li>
        <li>Need help with a specific milestone</li>
        <li>Leadership transitions</li>
      </ul>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${dashboardUrl}"
           style="background: #D4A853; color: white; padding: 16px 32px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          Continue Your Journey
        </a>
      </div>

      <p>Just reply to this email if you'd like to hop on a quick call to troubleshoot or adjust your timeline.</p>

      <p style="margin-top: 32px;">Travis<br>
      <span style="color: #5A6577;">DNA Discipleship</span></p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    churchId,
    notificationType: 'inactive_reminder'
  });
}

// =====================================================
// DNA GROUPS SYSTEM EMAILS
// =====================================================

// DNA Leader Magic Link Email (for re-authentication)
export async function sendDNALeaderMagicLinkEmail(
  to: string,
  leaderName: string,
  magicLink: string
) {
  const subject = 'Your DNA Groups Login Link';
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Hi ${leaderName},</h2>

      <p>Click the button below to access your DNA Groups Dashboard:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${magicLink}"
           style="background: #D4A853; color: white; padding: 16px 32px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          Access DNA Groups
        </a>
      </div>

      <p style="color: #5A6577; font-size: 14px;">
        This link expires in 7 days. If you didn't request this, you can safely ignore this email.
      </p>

      <p style="color: #5A6577; font-size: 14px;">
        Or copy this link: <br>
        <a href="${magicLink}" style="color: #2D6A6A;">${magicLink}</a>
      </p>

      <p style="color: #5A6577; font-size: 14px; margin-top: 30px;">
        — DNA Groups
      </p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// DNA Leader Invitation Email
export async function sendDNALeaderInvitationEmail(
  to: string,
  leaderName: string,
  signupUrl: string,
  churchName: string | null,
  inviterName: string,
  personalMessage?: string
) {
  const isChurchAffiliated = !!churchName;

  const subject = isChurchAffiliated
    ? `You've been invited to lead DNA groups at ${churchName}`
    : `You've been invited to lead DNA groups`;

  const introText = isChurchAffiliated
    ? `${inviterName} from ${churchName} has invited you to become a DNA leader!`
    : `${inviterName} has invited you to become a DNA leader with ARK Identity!`;

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Hi ${leaderName},</h2>

      <p>${introText}</p>

      ${personalMessage ? `
      <div style="background: #F8F9FA; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2D6A6A;">
        <p style="margin: 0; color: #5A6577; font-style: italic;">"${personalMessage}"</p>
        <p style="margin: 8px 0 0 0; color: #1A2332; font-weight: 500;">— ${inviterName}</p>
      </div>
      ` : ''}

      <p>As a DNA leader, you'll guide small groups through a 90-day discipleship journey that transforms lives and multiplies disciples.</p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${signupUrl}"
           style="background: #D4A853; color: white; padding: 16px 32px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          Accept Invitation
        </a>
      </div>

      <p style="color: #5A6577; font-size: 14px;">
        This invitation expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.
      </p>

      <p style="color: #5A6577; font-size: 14px;">
        Or copy this link: <br>
        <a href="${signupUrl}" style="color: #2D6A6A;">${signupUrl}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />

      <p style="color: #5A6577; font-size: 14px;">
        Making disciples who make disciples,<br>
        <strong>ARK Identity Team</strong>
      </p>

      <p style="color: #5A6577; font-size: 14px;">
        Questions? Reply to this email or visit <a href="https://dnadiscipleship.com/help" style="color: #2D6A6A;">dnadiscipleship.com/help</a>
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    notificationType: 'dna_leader_invitation'
  });
}

// DNA Leader Direct Invitation Email (with magic link - no signup form)
// This is sent when an admin invites a DNA leader - they click to log in directly
export async function sendDNALeaderDirectInviteEmail(
  to: string,
  leaderName: string,
  magicLink: string,
  churchName: string | null,
  inviterName: string,
  personalMessage?: string
) {
  const isChurchAffiliated = !!churchName;

  const subject = isChurchAffiliated
    ? `You've been invited to lead DNA groups at ${churchName}`
    : `You've been invited to lead DNA groups`;

  const introText = isChurchAffiliated
    ? `${inviterName} from ${churchName} has invited you to become a DNA leader!`
    : `${inviterName} has invited you to become a DNA leader with ARK Identity!`;

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Hi ${leaderName},</h2>

      <p>${introText}</p>

      ${personalMessage ? `
      <div style="background: #F8F9FA; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2D6A6A;">
        <p style="margin: 0; color: #5A6577; font-style: italic;">"${personalMessage}"</p>
        <p style="margin: 8px 0 0 0; color: #1A2332; font-weight: 500;">— ${inviterName}</p>
      </div>
      ` : ''}

      <p>As a DNA leader, you'll guide small groups through a 90-day discipleship journey that transforms lives and multiplies disciples.</p>

      <p><strong>Your account is ready!</strong> Click below to log in and get started:</p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${magicLink}"
           style="background: #D4A853; color: white; padding: 16px 32px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          Log In to DNA Hub
        </a>
      </div>

      <p style="color: #5A6577; font-size: 14px;">
        This link expires in 7 days. After that, you can always request a new login link from the login page.
      </p>

      <p style="color: #5A6577; font-size: 14px;">
        Or copy this link: <br>
        <a href="${magicLink}" style="color: #2D6A6A;">${magicLink}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />

      <p style="color: #5A6577; font-size: 14px;">
        Making disciples who make disciples,<br>
        <strong>ARK Identity Team</strong>
      </p>

      <p style="color: #5A6577; font-size: 14px;">
        Questions? Reply to this email or visit <a href="https://dnadiscipleship.com/help" style="color: #2D6A6A;">dnadiscipleship.com/help</a>
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    notificationType: 'dna_leader_direct_invite'
  });
}

// Church Leader Invitation Email (with magic link - for additional church leaders)
// This is sent when an admin/existing church leader invites a new church leader
export async function sendChurchLeaderInviteEmail(
  to: string,
  leaderName: string,
  magicLink: string,
  churchName: string,
  inviterName: string,
  personalMessage?: string
) {
  const subject = `You've been invited to lead DNA implementation at ${churchName}`;

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Hi ${leaderName},</h2>

      <p>${inviterName} has invited you to join the DNA implementation team at ${churchName}!</p>

      ${personalMessage ? `
      <div style="background: #F8F9FA; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2D6A6A;">
        <p style="margin: 0; color: #5A6577; font-style: italic;">"${personalMessage}"</p>
        <p style="margin: 8px 0 0 0; color: #1A2332; font-weight: 500;">— ${inviterName}</p>
      </div>
      ` : ''}

      <p>As a church leader in DNA Hub, you'll have access to:</p>

      <ul style="color: #5A6577; line-height: 1.8;">
        <li><strong>Implementation Dashboard</strong> - Track your church's DNA journey milestones</li>
        <li><strong>DNA Training</strong> - Flow Assessment, DNA Manual, and Launch Guide</li>
        <li><strong>DNA Groups</strong> - Manage and track discipleship groups</li>
      </ul>

      <p><strong>Your account is ready!</strong> Click below to log in and get started:</p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${magicLink}"
           style="background: #D4A853; color: white; padding: 16px 32px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          Log In to DNA Hub
        </a>
      </div>

      <p style="color: #5A6577; font-size: 14px;">
        This link expires in 7 days. After that, you can always request a new login link from the login page.
      </p>

      <p style="color: #5A6577; font-size: 14px;">
        Or copy this link: <br>
        <a href="${magicLink}" style="color: #2D6A6A;">${magicLink}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />

      <p style="color: #5A6577; font-size: 14px;">
        Making disciples who make disciples,<br>
        <strong>ARK Identity Team</strong>
      </p>

      <p style="color: #5A6577; font-size: 14px;">
        Questions? Reply to this email or visit <a href="https://dnadiscipleship.com/help" style="color: #2D6A6A;">dnadiscipleship.com/help</a>
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    notificationType: 'church_leader_invite'
  });
}

// =====================================================
// TRAINING PLATFORM EMAILS
// =====================================================

// Training Platform: Welcome email after signup
export async function sendTrainingWelcomeEmail(
  to: string,
  name: string,
  loginLink: string
) {
  const subject = 'Welcome to DNA Training - Your Journey Begins';
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #1A2332; color: #FFFFFF;">
      <div style="padding: 40px 32px; text-align: center;">
        <h1 style="color: #D4A853; margin: 0 0 8px 0; font-size: 28px;">Welcome to DNA Training</h1>
        <p style="color: #A0AEC0; margin: 0; font-size: 16px;">Your journey to becoming a DNA leader starts here</p>
      </div>

      <div style="background: #FFFBF5; padding: 32px; color: #1A2332;">
        <h2 style="margin: 0 0 16px 0; color: #1A2332;">Hey ${name},</h2>

        <p style="color: #5A6577; line-height: 1.6;">Welcome to DNA Discipleship! You've taken the first step toward becoming a leader who makes disciples who make disciples.</p>

        <div style="background: #F4E7D7; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h3 style="color: #1A2332; margin: 0 0 12px 0;">Your First Step: Flow Assessment</h3>
          <p style="color: #5A6577; margin: 0 0 8px 0; font-size: 14px;">Before you start leading others, we'll help you identify the internal roadblocks that could hinder your effectiveness. This 30-45 minute assessment will give you clarity on where God wants to grow you.</p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${loginLink}"
             style="background: #D4A853; color: #1A2332; padding: 16px 32px;
                    border-radius: 8px; text-decoration: none; font-weight: 600;
                    display: inline-block; font-size: 16px;">
            Start Your Journey
          </a>
        </div>

        <h3 style="color: #1A2332; margin: 24px 0 12px 0;">What's Ahead:</h3>
        <ol style="color: #5A6577; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li><strong>Flow Assessment</strong> - Identify your roadblocks (30-45 min)</li>
          <li><strong>DNA Manual</strong> - Learn the heart of discipleship (6 sessions)</li>
          <li><strong>Launch Guide</strong> - Prepare to lead your first group (5 phases)</li>
          <li><strong>Create Your DNA Group</strong> - Start making disciples!</li>
        </ol>

        <p style="color: #5A6577; margin-top: 24px; font-size: 14px;">
          This link expires in 24 hours. You can always request a new link from the login page.
        </p>

        <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />

        <p style="color: #5A6577; margin: 0;">
          Making disciples who make disciples,<br>
          <strong style="color: #1A2332;">The DNA Team</strong>
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    notificationType: 'training_welcome'
  });
}

// Training Platform: Magic link login email
export async function sendTrainingLoginEmail(
  to: string,
  name: string,
  loginLink: string
) {
  const subject = 'Your DNA Training Login Link';
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #1A2332; color: #FFFFFF;">
      <div style="padding: 32px; text-align: center;">
        <h1 style="color: #D4A853; margin: 0; font-size: 24px;">DNA Training</h1>
      </div>

      <div style="background: #FFFBF5; padding: 32px; color: #1A2332;">
        <h2 style="margin: 0 0 16px 0; color: #1A2332;">Hey ${name},</h2>

        <p style="color: #5A6577; line-height: 1.6;">Click the button below to access your DNA Training dashboard:</p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${loginLink}"
             style="background: #D4A853; color: #1A2332; padding: 16px 32px;
                    border-radius: 8px; text-decoration: none; font-weight: 600;
                    display: inline-block; font-size: 16px;">
            Access Training Dashboard
          </a>
        </div>

        <p style="color: #5A6577; font-size: 14px;">
          This link expires in 24 hours. If you didn't request this, you can safely ignore this email.
        </p>

        <p style="color: #5A6577; font-size: 14px;">
          Or copy this link:<br>
          <a href="${loginLink}" style="color: #2D6A6A; word-break: break-all;">${loginLink}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />

        <p style="color: #5A6577; margin: 0; font-size: 14px;">
          — DNA Training
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// Training Platform: Assessment complete email (DNA Manual unlocked)
export async function sendAssessmentCompleteEmail(
  to: string,
  name: string,
  dashboardLink: string,
  topRoadblocks: string[]
) {
  const roadblockList = topRoadblocks.length > 0
    ? topRoadblocks.map(r => `<li>${r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>`).join('')
    : '<li>No significant roadblocks identified</li>';

  const subject = 'Flow Assessment Complete - DNA Manual Unlocked!';
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #1A2332; color: #FFFFFF;">
      <div style="padding: 32px; text-align: center;">
        <h1 style="color: #D4A853; margin: 0; font-size: 24px;">Assessment Complete!</h1>
        <p style="color: #4A9E7F; margin: 8px 0 0 0; font-size: 16px;">✓ DNA Manual Now Unlocked</p>
      </div>

      <div style="background: #FFFBF5; padding: 32px; color: #1A2332;">
        <h2 style="margin: 0 0 16px 0; color: #1A2332;">Well done, ${name}!</h2>

        <p style="color: #5A6577; line-height: 1.6;">You've completed the Flow Assessment - an important step in preparing to lead others well. Awareness is the first step to breakthrough.</p>

        <div style="background: #F4E7D7; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h3 style="color: #1A2332; margin: 0 0 12px 0;">Your Top Roadblocks:</h3>
          <ul style="color: #5A6577; margin: 0; padding-left: 20px;">
            ${roadblockList}
          </ul>
          <p style="color: #5A6577; font-size: 14px; margin: 12px 0 0 0;">
            Don't forget to work through your action plan and connect with your accountability partner.
          </p>
        </div>

        <div style="background: #1A2332; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h3 style="color: #D4A853; margin: 0 0 8px 0;">What's Next: DNA Manual</h3>
          <p style="color: #E8E8E8; margin: 0; font-size: 14px;">
            6 sessions covering the heart and theology of multiplication discipleship. This will equip you with the "why" before the "how."
          </p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${dashboardLink}"
             style="background: #D4A853; color: #1A2332; padding: 16px 32px;
                    border-radius: 8px; text-decoration: none; font-weight: 600;
                    display: inline-block; font-size: 16px;">
            Continue to DNA Manual
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />

        <p style="color: #5A6577; margin: 0;">
          Keep going! You're on the path to becoming a multiplying disciple-maker.<br><br>
          — DNA Training
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    notificationType: 'assessment_complete'
  });
}

// Discovery Call Access Email
// Sent when a church leader books a Discovery Call on /assessment/book-call.
// Grants dashboard access via magic link — Launch Guide is inside the dashboard, not linked directly.
export async function sendDiscoveryCallAccessEmail(
  to: string,
  firstName: string,
  churchName: string,
  magicLink: string,
  churchId?: string
) {
  const subject = `Your DNA Dashboard Access — ${churchName}`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Hey ${firstName},</h2>

      <p>You just took a big step by booking a Discovery Call — I'm looking forward to connecting with you!</p>

      <p>In the meantime, I've unlocked your DNA Church Dashboard. Log in now and you'll find the DNA Launch Guide waiting for you inside.</p>

      <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
        <h3 style="color: #1A2332; margin: 0 0 8px 0;">Your Church Dashboard is Ready</h3>
        <p style="color: #5A6577; margin: 0 0 4px 0; font-size: 14px;">
          Inside you'll find the <strong>DNA Launch Guide</strong> and everything you need to prepare for our call.
        </p>
        <p style="color: #5A6577; margin: 0 0 20px 0; font-size: 14px;">
          You can also track ${churchName}'s implementation journey and manage your leadership team.
        </p>
        <a href="${magicLink}"
           style="background: #D4A853; color: white; padding: 14px 28px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block; font-size: 16px;">
          Log In to Your Dashboard
        </a>
      </div>

      <p style="color: #5A6577; font-size: 14px;">
        Your login link is valid for 7 days. After that, visit <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dnadiscipleship.com'}/login" style="color: #2D6A6A;">dnadiscipleship.com/login</a> to request a new one.
      </p>

      <p style="margin-top: 32px;">Travis<br>
      <span style="color: #5A6577;">DNA Discipleship</span></p>

      <p style="color: #5A6577; font-size: 14px; margin-top: 24px;">
        P.S. Have questions before our call? Just hit reply — I read every email.
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    churchId,
    notificationType: 'discovery_call_access'
  });
}

// 3 Steps resource email (sent after assessment)
export async function send3StepsEmail(
  to: string,
  firstName: string,
  readinessLevel: 'ready' | 'building' | 'exploring',
  churchId?: string
) {
  // PDF URLs - different version for each readiness level
  const threeStepsPdfUrls = {
    ready: process.env.THREE_STEPS_READY_URL || 'https://dnadiscipleship.com/3-steps-ready.pdf',
    building: process.env.THREE_STEPS_BUILDING_URL || 'https://dnadiscipleship.com/3-steps-building.pdf',
    exploring: process.env.THREE_STEPS_EXPLORING_URL || 'https://dnadiscipleship.com/3-steps-exploring.pdf',
  };

  // Additional resource URLs
  const launchGuideUrl = process.env.LAUNCH_GUIDE_URL || 'https://dnadiscipleship.com/launch-guide.pdf';
  const dnaManualUrl = process.env.DNA_MANUAL_URL || 'https://dnadiscipleship.com/dna-manual.pdf';
  const ninetyDayToolkitUrl = process.env.NINETY_DAY_TOOLKIT_URL || process.env.EIGHT_WEEK_TOOLKIT_URL || 'https://dnadiscipleship.com/90-day-toolkit.pdf';

  // Discovery call booking URL - uses env var defined at top of file
  const discoveryCallUrl = DISCOVERY_CALL_URL;

  const threeStepsUrl = threeStepsPdfUrls[readinessLevel];

  // Tiered content — ready level has a single CTA (book call = unlock dashboard + Launch Guide)
  // building/exploring get DNA Manual first, then discovery call
  const tieredContent = {
    ready: {
      headline: "You're Ready to Launch!",
      message: "Your church shows strong alignment for DNA implementation. You have the leadership buy-in and foundation in place to move quickly.",
      resourceBlock: null, // no separate resource — the call IS the next step
      callIncentive: "Book your Discovery Call to unlock your DNA Church Dashboard — where you'll find the Launch Guide and everything you need to get started.",
    },
    building: {
      headline: "You're Building the Foundation",
      message: "You're on the right track. There are a few things to align before launching DNA, and we can help you get there.",
      resourceBlock: {
        title: "Read the DNA Manual",
        description: "Understand the theology and heart behind DNA. Share it with your leadership team.",
        url: dnaManualUrl,
        linkText: "Download DNA Manual",
      },
      callIncentive: "Book your Discovery Call and we'll unlock the DNA Launch Guide in your Church Dashboard.",
    },
    exploring: {
      headline: "You're in Discovery Mode",
      message: "DNA might be a good fit down the road. Start by understanding the vision and sharing it with your team.",
      resourceBlock: {
        title: "Read the DNA Manual",
        description: "Start with the 'why' behind multiplication discipleship before the 'how'.",
        url: dnaManualUrl,
        linkText: "Download DNA Manual",
      },
      callIncentive: "Let's discuss your path forward together on a 15-minute Discovery Call.",
    }
  };

  const content = tieredContent[readinessLevel];

  const subject = `Your 3 Steps to Becoming a Community That Multiplies`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Hey ${firstName},</h2>

      <p>Thanks for completing the DNA Church Readiness Assessment!</p>

      <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
        <h3 style="color: #1A2332; margin: 0 0 16px 0;">3 Steps to Becoming a Community That Multiplies</h3>
        <p style="margin: 0 0 20px 0; color: #5A6577;">Your personalized guide based on where your church is right now.</p>
        <a href="${threeStepsUrl}"
           style="background: #D4A853; color: white; padding: 16px 32px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          Download Your 3 Steps Guide (PDF)
        </a>
      </div>

      <div style="background: #1A2332; color: white; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <h3 style="color: #D4A853; margin: 0 0 12px 0;">${content.headline}</h3>
        <p style="margin: 0; color: #E8E8E8;">${content.message}</p>
      </div>

      ${content.resourceBlock ? `
      <div style="background: #F8F9FA; padding: 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2D6A6A;">
        <h4 style="color: #1A2332; margin: 0 0 8px 0;">${content.resourceBlock.title}</h4>
        <p style="color: #5A6577; margin: 0 0 12px 0; font-size: 14px;">${content.resourceBlock.description}</p>
        <a href="${content.resourceBlock.url}"
           style="color: #2D6A6A; text-decoration: none; font-weight: 500;">
          ${content.resourceBlock.linkText} →
        </a>
      </div>
      ` : ''}

      <div style="background: #1A2332; padding: 24px; border-radius: 8px; margin: 16px 0; text-align: center;">
        <h4 style="color: #D4A853; margin: 0 0 8px 0;">Book Your Discovery Call</h4>
        <p style="color: #E8E8E8; margin: 0 0 16px 0; font-size: 14px;">${content.callIncentive}</p>
        <a href="${discoveryCallUrl}"
           style="background: #D4A853; color: white; padding: 14px 28px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          Book a Discovery Call (15 min)
        </a>
      </div>

      <p style="margin-top: 32px;">Travis<br>
      <span style="color: #5A6577;">DNA Discipleship</span></p>

      <p style="color: #5A6577; font-size: 14px; margin-top: 24px;">
        P.S. Have questions? Just hit reply. I read every email.
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    churchId,
    notificationType: '3_steps_email'
  });
}

// =====================================================
// DAILY DNA APP EMAILS
// =====================================================

// Daily DNA App: Invitation email sent when a leader adds a disciple to a group
export async function sendDailyDNAInvitationEmail(
  to: string,
  discipleName: string,
  leaderName: string,
  groupName: string,
  churchSubdomain?: string | null
) {
  const baseUrl = process.env.DAILY_DNA_APP_URL || 'https://dailydna.app';
  const appUrl = churchSubdomain ? `https://${churchSubdomain}.dailydna.app` : baseUrl;

  const subject = `${leaderName} added you to a DNA group - get the Daily DNA app`;

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #1A2332; color: #FFFFFF;">
      <div style="padding: 32px; text-align: center;">
        <h1 style="color: #D4A853; margin: 0; font-size: 24px;">Daily DNA</h1>
        <p style="color: #A0AEC0; margin: 8px 0 0 0; font-size: 14px;">Your discipleship companion</p>
      </div>

      <div style="background: #FFFBF5; padding: 32px; color: #1A2332;">
        <h2 style="margin: 0 0 16px 0; color: #1A2332;">Hey ${discipleName},</h2>

        <p style="color: #5A6577; line-height: 1.6;">${leaderName} has added you to the DNA group <strong>${groupName}</strong>. You're about to start an exciting discipleship journey!</p>

        <div style="background: #F4E7D7; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h3 style="color: #1A2332; margin: 0 0 12px 0;">Get the Daily DNA App</h3>
          <p style="color: #5A6577; margin: 0 0 8px 0; font-size: 14px;">
            The Daily DNA app is your personal companion for the journey. Use it to:
          </p>
          <ul style="color: #5A6577; margin: 8px 0 0 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
            <li><strong>3D Journal</strong> - Engage with Scripture daily (Head, Heart, Hands)</li>
            <li><strong>4D Prayer</strong> - Build a consistent prayer life</li>
            <li><strong>90-Day Toolkit</strong> - Track your growth milestones</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${appUrl}"
             style="background: #D4A853; color: #1A2332; padding: 16px 32px;
                    border-radius: 8px; text-decoration: none; font-weight: 600;
                    display: inline-block; font-size: 16px;">
            Get Started on Daily DNA
          </a>
        </div>

        <p style="color: #5A6577; font-size: 14px;">
          Sign up with this email address (<strong>${to}</strong>) so your leader can track your progress.
        </p>

        <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />

        <p style="color: #5A6577; margin: 0;">
          Making disciples who make disciples,<br>
          <strong style="color: #1A2332;">The DNA Team</strong>
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    notificationType: 'daily_dna_invitation'
  });
}

// Co-Leader Invitation Email
// Sent to a DNA leader when they are invited to be a co-leader for a group
export async function sendCoLeaderInvitationEmail(
  to: string,
  leaderName: string,
  groupName: string,
  inviterName: string,
  acceptUrl: string,
  declineUrl: string
) {
  const subject = `${inviterName} invited you to co-lead "${groupName}"`;

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1A2332; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <p style="color: #D4A853; font-weight: 600; letter-spacing: 2px; margin: 0; font-size: 14px;">DNA DISCIPLESHIP</p>
      </div>
      <div style="background: #242D3D; padding: 32px; border-radius: 0 0 12px 12px;">
        <h1 style="color: #FFFFFF; font-size: 24px; margin: 0 0 16px 0;">Co-Leader Invitation</h1>
        <p style="color: #CBD5E0; font-size: 16px; line-height: 1.6;">
          Hi ${leaderName},
        </p>
        <p style="color: #CBD5E0; font-size: 16px; line-height: 1.6;">
          <strong style="color: #FFFFFF;">${inviterName}</strong> has invited you to co-lead the DNA group
          <strong style="color: #D4A853;">${groupName}</strong>.
        </p>
        <p style="color: #A0AEC0; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">
          As co-leader, you'll have full access to manage the group alongside the primary leader — including
          tracking disciples, managing phases, and scheduling events.
        </p>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${acceptUrl}"
             style="display: inline-block; padding: 14px 32px; background: #D4A853; color: #1A2332; border-radius: 8px; font-weight: 600; font-size: 16px; text-decoration: none; margin-right: 12px;">
            Accept
          </a>
          <a href="${declineUrl}"
             style="display: inline-block; padding: 14px 32px; background: transparent; color: #A0AEC0; border-radius: 8px; font-weight: 600; font-size: 16px; text-decoration: none; border: 1px solid #3D4A5C;">
            Decline
          </a>
        </div>

        <p style="color: #5A6577; font-size: 13px; text-align: center;">
          This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    notificationType: 'co_leader_invitation'
  });
}
