import { Resend } from 'resend';

const FROM_EMAIL = 'DNA Church Hub <notifications@mail.arkidentity.com>';
const TRAVIS_EMAIL = 'thearkidentity@gmail.com';

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
}

async function sendEmail({ to, subject, html }: EmailOptions) {
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
    });

    if (error) {
      console.error('[EMAIL] Resend API error:', JSON.stringify(error));
      return { success: false, error };
    }

    console.log('[EMAIL] Successfully sent, ID:', data?.id);
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
  contactEmail: string
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

  return sendEmail({ to: TRAVIS_EMAIL, subject, html });
}

// Notification: Key milestone completed
export async function sendMilestoneNotification(
  churchName: string,
  milestoneName: string,
  phaseName: string,
  completedBy: string
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

  return sendEmail({ to: TRAVIS_EMAIL, subject, html });
}

// Notification: Phase completed
export async function sendPhaseCompletionNotification(
  churchName: string,
  phaseNumber: number,
  phaseName: string
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

  return sendEmail({ to: TRAVIS_EMAIL, subject, html });
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
  // TODO: Replace with actual hosted PDF URL when available
  const manualUrl = process.env.DNA_MANUAL_URL || 'https://arkidentity.com/dna-manual.pdf';
  const assessmentUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/assessment`
    : 'https://dna.arkidentity.com/assessment';

  const subject = 'Your DNA Manual is here';
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Hey ${firstName},</h2>

      <p>Thanks for your interest in DNA Discipleship!</p>

      <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 16px 0; font-weight: 600; color: #1A2332;">Here's your resource:</p>
        <a href="${manualUrl}"
           style="background: #D4A853; color: white; padding: 16px 32px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          Download DNA Manual (PDF)
        </a>
      </div>

      <h3 style="color: #1A2332; margin-top: 32px;">Where to start:</h3>
      <p>Read the DNA Manual first (6 sessions, ~49 pages). It covers the heart and theology behind multiplication discipleship.</p>
      <p>This will help you decide if DNA is right for your church.</p>

      <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />

      <h3 style="color: #1A2332;">Ready to explore further?</h3>
      <p>Take our 5-minute Church Assessment to see if DNA is a good fit:</p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${assessmentUrl}"
           style="background: #2D6A6A; color: white; padding: 14px 28px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          See If DNA Is Right for Your Church
        </a>
      </div>

      <p>We'll give you personalized next steps based on your answers.</p>

      <p style="margin-top: 32px;">Travis<br>
      <span style="color: #5A6577;">ARK Identity Discipleship</span></p>

      <p style="color: #5A6577; font-size: 14px; margin-top: 24px;">
        P.S. Have questions? Just hit reply. I read every email.
      </p>
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
  portalUrl: string
) {
  // Proposal Review Call (30 min)
  const proposalCallUrl = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1E8bA8sb4SP7QBJw45-6zKwxVNFu6x7w4YMBABJ1qdiE9ALT7hGvOlJ2RUGcfV9LwopqFiGPGe?gv=true';

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
      <span style="color: #5A6577;">ARK Identity Discipleship</span></p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// Sent when admin moves church to 'awaiting_strategy' - after agreement
export async function sendAgreementConfirmedEmail(
  to: string,
  firstName: string,
  churchName: string,
  tierName: string,
  portalUrl: string
) {
  // Strategy Call (60 min)
  const strategyCallUrl = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ06-H6-Lu-ReUlLa7bTB0qgXj9c1DxocZWH7WxTLw__s9chlLMDflEtH_my63oqNrQAaV7oahqR?gv=true';

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
      <span style="color: #5A6577;">ARK Identity Discipleship</span></p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// Sent when admin moves church to 'active' - after strategy call, full dashboard access
export async function sendDashboardAccessEmail(
  to: string,
  firstName: string,
  churchName: string,
  dashboardUrl: string
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
      <span style="color: #5A6577;">ARK Identity Discipleship</span></p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

// 3 Steps resource email (sent after assessment)
export async function send3StepsEmail(
  to: string,
  firstName: string,
  readinessLevel: 'ready' | 'building' | 'exploring'
) {
  // PDF URLs - different version for each readiness level
  const threeStepsPdfUrls = {
    ready: process.env.THREE_STEPS_READY_URL || 'https://arkidentity.com/3-steps-ready.pdf',
    building: process.env.THREE_STEPS_BUILDING_URL || 'https://arkidentity.com/3-steps-building.pdf',
    exploring: process.env.THREE_STEPS_EXPLORING_URL || 'https://arkidentity.com/3-steps-exploring.pdf',
  };

  // Additional resource URLs
  const launchGuideUrl = process.env.LAUNCH_GUIDE_URL || 'https://arkidentity.com/launch-guide.pdf';
  const dnaManualUrl = process.env.DNA_MANUAL_URL || 'https://arkidentity.com/dna-manual.pdf';
  const eightWeekToolkitUrl = process.env.EIGHT_WEEK_TOOLKIT_URL || 'https://arkidentity.com/8-week-toolkit.pdf';

  // Discovery call booking URL
  const discoveryCallUrl = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0LdUpKkvo_qoOrtiu6fQfPgkQJUZaG9RxPtYVieJrl1RAFnUmgTN9WATs6jAxSbkdo5M4-bpfI?gv=true';

  const threeStepsUrl = threeStepsPdfUrls[readinessLevel];

  // Tiered content matching thank-you page
  const tieredContent = {
    ready: {
      headline: "You're Ready to Launch!",
      message: "Your church shows strong alignment for DNA implementation. You have the leadership buy-in and foundation in place to move quickly.",
      suggestion1Title: "Get Your Launch Guide",
      suggestion1Description: "Everything you need to prepare for a successful DNA launch at your church.",
      suggestion1Url: launchGuideUrl,
      suggestion1ButtonText: "Download Launch Guide",
      suggestion2Incentive: "Book your Discovery Call now and receive the 8-Week Implementation Toolkit",
      cta: "Book Discovery Call (15 min)"
    },
    building: {
      headline: "You're Building the Foundation",
      message: "You're on the right track. There are a few things to align before launching DNA, and we can help you get there.",
      suggestion1Title: "Read the DNA Manual",
      suggestion1Description: "Understand the theology and heart behind DNA. Share it with your leadership team.",
      suggestion1Url: dnaManualUrl,
      suggestion1ButtonText: "Download DNA Manual",
      suggestion2Incentive: "Book your Discovery Call now and receive the Launch Guide",
      cta: "Book Discovery Call (15 min)"
    },
    exploring: {
      headline: "You're in Discovery Mode",
      message: "DNA might be a good fit down the road. Start by understanding the vision and sharing it with your team.",
      suggestion1Title: "Read the DNA Manual",
      suggestion1Description: "Start with the 'why' behind multiplication discipleship before the 'how'.",
      suggestion1Url: dnaManualUrl,
      suggestion1ButtonText: "Download DNA Manual",
      suggestion2Incentive: "Let's discuss your path forward together",
      cta: "Book Discovery Call (15 min)"
    }
  };

  const content = tieredContent[readinessLevel];

  const subject = `Your 3 Steps to Becoming a Community That Multiplies`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Hey ${firstName},</h2>

      <p>Thanks for completing the DNA Church Assessment!</p>

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

      <h3 style="color: #1A2332;">Suggested Next Steps</h3>

      <div style="background: #F8F9FA; padding: 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2D6A6A;">
        <h4 style="color: #1A2332; margin: 0 0 8px 0;">${content.suggestion1Title}</h4>
        <p style="color: #5A6577; margin: 0 0 12px 0; font-size: 14px;">${content.suggestion1Description}</p>
        <a href="${content.suggestion1Url}"
           style="color: #2D6A6A; text-decoration: none; font-weight: 500;">
          ${content.suggestion1ButtonText} →
        </a>
      </div>

      <div style="background: #1A2332; padding: 20px; border-radius: 8px; margin: 16px 0;">
        <h4 style="color: white; margin: 0 0 8px 0;">Book Your Discovery Call</h4>
        <p style="color: #E8E8E8; margin: 0 0 12px 0; font-size: 14px;">A 15-minute conversation to see if DNA is the right fit for your church.</p>
        <p style="color: #D4A853; margin: 0 0 16px 0; font-size: 14px; font-weight: 500;">${content.suggestion2Incentive}</p>
        <a href="${discoveryCallUrl}"
           style="background: #D4A853; color: white; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          ${content.cta}
        </a>
      </div>

      <p style="margin-top: 32px;">Travis<br>
      <span style="color: #5A6577;">ARK Identity Discipleship</span></p>

      <p style="color: #5A6577; font-size: 14px; margin-top: 24px;">
        P.S. Have questions? Just hit reply. I read every email.
      </p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}
