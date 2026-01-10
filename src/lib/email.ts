import { Resend } from 'resend';

const FROM_EMAIL = 'DNA Church Hub <notifications@arkidentity.com>';
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
    console.log('[EMAIL - DEV MODE]', { to, subject });
    return { success: true, dev: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
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
