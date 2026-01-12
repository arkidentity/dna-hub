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

// 3 Steps resource email (sent after assessment)
export async function send3StepsEmail(
  to: string,
  firstName: string,
  readinessLevel: 'ready' | 'building' | 'exploring'
) {
  // TODO: Replace with actual hosted PDF URL when available
  const threeStepsUrl = process.env.THREE_STEPS_URL || 'https://arkidentity.com/3-steps.pdf';
  const discoveryCallUrl = 'https://calendar.app.google/Qi2b2ZNx163nYdeR7';

  const readinessMessages = {
    ready: {
      headline: "You're Ready to Launch!",
      message: "Based on your assessment, your church shows strong alignment for DNA implementation. Let's talk about next steps.",
      cta: "Book Your Discovery Call"
    },
    building: {
      headline: "You're Building the Foundation",
      message: "You're on the right track. There are a few things to align before launching DNA, and we can help you get there.",
      cta: "Let's Discuss Your Path Forward"
    },
    exploring: {
      headline: "You're in Discovery Mode",
      message: "DNA might be a good fit down the road. Start with the 3 Steps guide and the DNA Manual to cast vision with your team.",
      cta: "Have Questions? Let's Talk"
    }
  };

  const content = readinessMessages[readinessLevel];

  const subject = `Your Personalized 3 Steps to Becoming a Community That Multiplies`;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1A2332;">Hey ${firstName},</h2>

      <p>Thanks for completing the DNA Church Assessment!</p>

      <div style="background: #1A2332; color: white; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <h3 style="color: #D4A853; margin: 0 0 12px 0;">${content.headline}</h3>
        <p style="margin: 0; color: #E8E8E8;">${content.message}</p>
      </div>

      <h3 style="color: #1A2332;">Your Resource: 3 Steps to Becoming a Community That Multiplies</h3>
      <p>This guide will help you understand the foundational steps every church needs to take before launching DNA groups.</p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${threeStepsUrl}"
           style="background: #D4A853; color: white; padding: 16px 32px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          Download 3 Steps Guide (PDF)
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />

      <h3 style="color: #1A2332;">Next Step: Book a Discovery Call</h3>
      <p>A 15-minute conversation to see if DNA is the right fit for your church. No pressure, no sales pitch—just an honest conversation about where you are and where you want to go.</p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${discoveryCallUrl}"
           style="background: #2D6A6A; color: white; padding: 14px 28px;
                  border-radius: 8px; text-decoration: none; font-weight: 500;
                  display: inline-block;">
          ${content.cta}
        </a>
      </div>

      <p style="margin-top: 32px;">Travis<br>
      <span style="color: #5A6577;">ARK Identity Discipleship</span></p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}
