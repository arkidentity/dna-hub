'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Users,
  UserPlus,
  BookOpen,
  Building2,
  Settings,
  Eye,
  Mail,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailPreview {
  id: string;
  name: string;
  subject: string;
  trigger: string;
  variables: string[];
  html: string;
}

interface PageItem {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  requiresAuth?: boolean;
  testHref?: string;
  emails?: EmailPreview[];
}

interface Section {
  label: string;
  badge: string;
  badgeColor: string;
  headerColor: string;
  items?: PageItem[];
  emails?: EmailPreview[];
}

// ─── Email Templates ──────────────────────────────────────────────────────────

const trainingWelcomeHtml = `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #1A2332; color: #FFFFFF;">
  <div style="padding: 40px 32px; text-align: center;">
    <h1 style="color: #D4A853; margin: 0 0 8px 0; font-size: 28px;">Welcome to DNA Training</h1>
    <p style="color: #A0AEC0; margin: 0; font-size: 16px;">Your journey to becoming a DNA leader starts here</p>
  </div>
  <div style="background: #FFFBF5; padding: 32px; color: #1A2332;">
    <h2 style="margin: 0 0 16px 0; color: #1A2332;">Hey {{name}},</h2>
    <p style="color: #5A6577; line-height: 1.6;">Welcome to DNA Discipleship! You've taken the first step toward becoming a leader who makes disciples who make disciples.</p>
    <div style="background: #F4E7D7; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h3 style="color: #1A2332; margin: 0 0 12px 0;">Your First Step: Flow Assessment</h3>
      <p style="color: #5A6577; margin: 0 0 8px 0; font-size: 14px;">Before you start leading others, we'll help you identify the internal roadblocks that could hinder your effectiveness. This 30-45 minute assessment will give you clarity on where God wants to grow you.</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{loginLink}}" style="background: #D4A853; color: #1A2332; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">Start Your Journey</a>
    </div>
    <h3 style="color: #1A2332; margin: 24px 0 12px 0;">What's Ahead:</h3>
    <ol style="color: #5A6577; margin: 0; padding-left: 20px; line-height: 1.8;">
      <li><strong>Flow Assessment</strong> - Identify your roadblocks (30-45 min)</li>
      <li><strong>DNA Manual</strong> - Learn the heart of discipleship (6 sessions)</li>
      <li><strong>Launch Guide</strong> - Prepare to lead your first group (5 phases)</li>
      <li><strong>Create Your DNA Group</strong> - Start making disciples!</li>
    </ol>
    <p style="color: #5A6577; margin-top: 24px; font-size: 14px;">This link expires in 24 hours. You can always request a new link from the login page.</p>
    <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />
    <p style="color: #5A6577; margin: 0;">Making disciples who make disciples,<br><strong style="color: #1A2332;">The DNA Team</strong></p>
  </div>
</div>`;

const trainingLoginHtml = `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #1A2332; color: #FFFFFF;">
  <div style="padding: 32px; text-align: center;">
    <h1 style="color: #D4A853; margin: 0; font-size: 24px;">DNA Training</h1>
  </div>
  <div style="background: #FFFBF5; padding: 32px; color: #1A2332;">
    <h2 style="margin: 0 0 16px 0; color: #1A2332;">Hey {{name}},</h2>
    <p style="color: #5A6577; line-height: 1.6;">Click the button below to access your DNA Training dashboard:</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{loginLink}}" style="background: #D4A853; color: #1A2332; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">Access Training Dashboard</a>
    </div>
    <p style="color: #5A6577; font-size: 14px;">This link expires in 24 hours. If you didn't request this, you can safely ignore this email.</p>
    <p style="color: #5A6577; font-size: 14px;">Or copy this link:<br><a href="{{loginLink}}" style="color: #2D6A6A; word-break: break-all;">{{loginLink}}</a></p>
    <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />
    <p style="color: #5A6577; margin: 0; font-size: 14px;">— DNA Training</p>
  </div>
</div>`;

const assessmentCompleteHtml = `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #1A2332; color: #FFFFFF;">
  <div style="padding: 32px; text-align: center;">
    <h1 style="color: #D4A853; margin: 0; font-size: 24px;">Assessment Complete!</h1>
    <p style="color: #4A9E7F; margin: 8px 0 0 0; font-size: 16px;">&#10003; DNA Manual Now Unlocked</p>
  </div>
  <div style="background: #FFFBF5; padding: 32px; color: #1A2332;">
    <h2 style="margin: 0 0 16px 0; color: #1A2332;">Well done, {{name}}!</h2>
    <p style="color: #5A6577; line-height: 1.6;">You've completed the Flow Assessment - an important step in preparing to lead others well. Awareness is the first step to breakthrough.</p>
    <div style="background: #F4E7D7; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h3 style="color: #1A2332; margin: 0 0 12px 0;">Your Top Roadblocks:</h3>
      <ul style="color: #5A6577; margin: 0; padding-left: 20px;"><li>Fear Of Failure</li><li>People Pleasing</li><li>Lack Of Vision</li></ul>
      <p style="color: #5A6577; font-size: 14px; margin: 12px 0 0 0;">Don't forget to work through your action plan and connect with your accountability partner.</p>
    </div>
    <div style="background: #1A2332; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h3 style="color: #D4A853; margin: 0 0 8px 0;">What's Next: DNA Manual</h3>
      <p style="color: #E8E8E8; margin: 0; font-size: 14px;">6 sessions covering the heart and theology of multiplication discipleship. This will equip you with the "why" before the "how."</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{dashboardLink}}" style="background: #D4A853; color: #1A2332; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">Continue to DNA Manual</a>
    </div>
    <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />
    <p style="color: #5A6577; margin: 0;">Keep going! You're on the path to becoming a multiplying disciple-maker.<br><br>— DNA Training</p>
  </div>
</div>`;

const dnaLeaderReminderHtml = `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #1A2332; padding: 24px 32px; text-align: center;">
    <p style="color: #D4A853; font-weight: 600; letter-spacing: 2px; margin: 0; font-size: 13px;">DNA DISCIPLESHIP</p>
  </div>
  <div style="background: #FFFBF5; padding: 40px 32px;">
    <h2 style="color: #1A2332; margin: 0 0 8px 0; font-size: 22px;">Your account is ready — let's get started!</h2>
    <p style="color: #5A6577; font-size: 14px; margin: 0 0 24px 0;">Hey {{firstName}},</p>
    <p style="color: #3D4A5C; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">{{fromName}} from {{churchName}} sent you a quick reminder that your DNA leader account is set up and ready to go. Your next step is to log in and complete your <strong>Flow Assessment</strong> — it only takes about 30 minutes and it's the foundation for everything else.</p>
    <div style="background: #F4E7D7; padding: 20px 24px; border-radius: 8px; margin: 0 0 28px 0;">
      <p style="color: #1A2332; font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; margin: 0 0 6px 0;">Your training path</p>
      <p style="color: #5A6577; font-size: 14px; margin: 0;">1. Flow Assessment <span style="color: #A0AEC0; font-size: 12px;">(30\u201345 min)</span></p>
      <p style="color: #5A6577; font-size: 14px; margin: 0;">2. DNA Manual <span style="color: #A0AEC0; font-size: 12px;">(6 sessions)</span></p>
      <p style="color: #5A6577; font-size: 14px; margin: 0;">3. Launch Guide <span style="color: #A0AEC0; font-size: 12px;">(5 phases)</span></p>
    </div>
    <div style="text-align: center; margin: 0 0 32px 0;">
      <a href="{{loginUrl}}" style="background: #D4A853; color: #1A2332; padding: 15px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 15px;">Set Up My Account</a>
    </div>
    <p style="color: #5A6577; font-size: 13px; line-height: 1.6; margin: 0;">Questions? Reach out to {{fromName}} or reply to this email.</p>
  </div>
  <div style="background: #2a2825; padding: 16px 32px; text-align: center;">
    <p style="font-family: system-ui, sans-serif; font-size: 11px; color: rgba(247,244,239,0.35); margin: 0;">DNA Discipleship \u00b7 dnadiscipleship.com</p>
  </div>
</div>`;

const dnaLeaderDirectInviteHtml = `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hi {{leaderName}},</h2>
  <p>{{inviterName}} from {{churchName}} has invited you to become a DNA leader!</p>
  <p>As a DNA leader, you'll guide small groups through a 90-day discipleship journey that transforms lives and multiplies disciples.</p>
  <p><strong>Your account is ready!</strong> Click the button below to create your password and get started. This link is for your account only \u2014 it expires in 24 hours.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{loginUrl}}" style="background: #D4A853; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Set Up My Account</a>
  </div>
  <p style="color: #5A6577; font-size: 14px;">Prefer Google? You can also sign in at <a href="https://dnadiscipleship.com/login" style="color: #2D6A6A;">dnadiscipleship.com/login</a> using <strong>Continue with Google</strong> \u2014 just make sure to use this email address: <strong>{{email}}</strong></p>
  <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />
  <p style="color: #5A6577; font-size: 14px;">Making disciples who make disciples,<br><strong>ARK Identity Team</strong></p>
  <p style="color: #5A6577; font-size: 14px;">Questions? Reply to this email or contact <a href="mailto:info@dnadiscipleship.com" style="color: #2D6A6A;">info@dnadiscipleship.com</a></p>
</div>`;

const dnaLeaderInvitationHtml = `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hi {{leaderName}},</h2>
  <p>{{inviterName}} from {{churchName}} has invited you to become a DNA leader!</p>
  <p>As a DNA leader, you'll guide small groups through a 90-day discipleship journey that transforms lives and multiplies disciples.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{signupUrl}}" style="background: #D4A853; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Accept Invitation</a>
  </div>
  <p style="color: #5A6577; font-size: 14px;">This invitation expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />
  <p style="color: #5A6577; font-size: 14px;">Making disciples who make disciples,<br><strong>ARK Identity Team</strong></p>
  <p style="color: #5A6577; font-size: 14px;">Questions? Reply to this email or contact <a href="mailto:info@dnadiscipleship.com" style="color: #2D6A6A;">info@dnadiscipleship.com</a></p>
</div>`;

const dnaLeaderMagicLinkHtml = `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hi {{name}},</h2>
  <p>Click the button below to access your DNA Groups Dashboard:</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{magicLink}}" style="background: #2D6A6A; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Access DNA Groups</a>
  </div>
  <p style="color: #5A6577; font-size: 14px;">This link expires in 7 days. If you didn't request this, you can safely ignore this email.</p>
  <p style="color: #5A6577; font-size: 14px;">Or copy this link: <br><a href="{{magicLink}}" style="color: #2D6A6A;">{{magicLink}}</a></p>
  <p style="color: #5A6577; font-size: 14px; margin-top: 30px;">\u2014 DNA Groups</p>
</div>`;

const coLeaderInvitationHtml = `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #1A2332; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <p style="color: #D4A853; font-weight: 600; letter-spacing: 2px; margin: 0; font-size: 14px;">DNA DISCIPLESHIP</p>
  </div>
  <div style="background: #242D3D; padding: 32px; border-radius: 0 0 12px 12px;">
    <h1 style="color: #FFFFFF; font-size: 24px; margin: 0 0 16px 0;">Co-Leader Invitation</h1>
    <p style="color: #CBD5E0; font-size: 16px; line-height: 1.6;">Hi {{leaderName}},</p>
    <p style="color: #CBD5E0; font-size: 16px; line-height: 1.6;"><strong style="color: #FFFFFF;">{{inviterName}}</strong> has invited you to co-lead the DNA group <strong style="color: #D4A853;">{{groupName}}</strong>.</p>
    <p style="color: #A0AEC0; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">As co-leader, you'll have full access to manage the group alongside the primary leader \u2014 including tracking disciples, managing phases, and scheduling events.</p>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="{{acceptUrl}}" style="display: inline-block; padding: 14px 32px; background: #D4A853; color: #1A2332; border-radius: 8px; font-weight: 600; font-size: 16px; text-decoration: none; margin-right: 12px;">Accept</a>
      <a href="{{declineUrl}}" style="display: inline-block; padding: 14px 32px; background: transparent; color: #A0AEC0; border-radius: 8px; font-weight: 600; font-size: 16px; text-decoration: none; border: 1px solid #3D4A5C;">Decline</a>
    </div>
    <p style="color: #5A6577; font-size: 13px; text-align: center;">This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.</p>
  </div>
</div>`;

const coLeaderNewUserInviteHtml = `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #1A2332; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <p style="color: #D4A853; font-weight: 600; letter-spacing: 2px; margin: 0; font-size: 14px;">DNA DISCIPLESHIP</p>
  </div>
  <div style="background: #242D3D; padding: 32px; border-radius: 0 0 12px 12px;">
    <h1 style="color: #FFFFFF; font-size: 24px; margin: 0 0 16px 0;">You've Been Invited!</h1>
    <p style="color: #CBD5E0; font-size: 16px; line-height: 1.6;">Hi {{leaderName}},</p>
    <p style="color: #CBD5E0; font-size: 16px; line-height: 1.6;"><strong style="color: #FFFFFF;">{{inviterName}}</strong> has invited you to co-lead the DNA group <strong style="color: #D4A853;">{{groupName}}</strong>.</p>
    <p style="color: #A0AEC0; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">As co-leader, you'll have full access to manage the group alongside the primary leader \u2014 including tracking disciples, managing phases, and scheduling events.</p>
    <p style="color: #A0AEC0; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">Click below to create your free leader account and accept the invitation.</p>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="{{signupUrl}}" style="display: inline-block; padding: 14px 32px; background: #D4A853; color: #1A2332; border-radius: 8px; font-weight: 600; font-size: 16px; text-decoration: none;">Accept &amp; Create Account</a>
    </div>
    <p style="color: #5A6577; font-size: 13px; text-align: center; margin-bottom: 8px;">This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.</p>
    <p style="color: #5A6577; font-size: 13px; text-align: center;">Already have a DNA leader account? <a href="{{existingAccountUrl}}" style="color: #D4A853; text-decoration: none;">Sign in here</a></p>
  </div>
</div>`;

const dailyDnaInvitationHtml = `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #1A2332; color: #FFFFFF;">
  <div style="padding: 32px; text-align: center;">
    <h1 style="color: #D4A853; margin: 0; font-size: 24px;">Daily DNA</h1>
    <p style="color: #A0AEC0; margin: 8px 0 0 0; font-size: 14px;">Your discipleship companion</p>
  </div>
  <div style="background: #FFFBF5; padding: 32px; color: #1A2332;">
    <h2 style="margin: 0 0 16px 0; color: #1A2332;">Hey {{discipleName}},</h2>
    <p style="color: #5A6577; line-height: 1.6;">{{leaderName}} has added you to the DNA group <strong>{{groupName}}</strong>. You're about to start an exciting discipleship journey!</p>
    <div style="background: #F4E7D7; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <h3 style="color: #1A2332; margin: 0 0 12px 0;">Get the Daily DNA App</h3>
      <p style="color: #5A6577; margin: 0 0 8px 0; font-size: 14px;">The Daily DNA app is your personal companion for the journey. Use it to:</p>
      <ul style="color: #5A6577; margin: 8px 0 0 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
        <li><strong>3D Journal</strong> - Engage with Scripture daily (Head, Heart, Hands)</li>
        <li><strong>4D Prayer</strong> - Build a consistent prayer life</li>
        <li><strong>90-Day Toolkit</strong> - Track your growth milestones</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{appUrl}}" style="background: #D4A853; color: #1A2332; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">Get Started on Daily DNA</a>
    </div>
    <p style="color: #5A6577; font-size: 14px;">Sign up with this email address (<strong>{{email}}</strong>) so your leader can track your progress.</p>
    <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />
    <p style="color: #5A6577; margin: 0;">Making disciples who make disciples,<br><strong style="color: #1A2332;">The DNA Team</strong></p>
  </div>
</div>`;

const churchLeaderInviteHtml = `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hi {{leaderName}},</h2>
  <p>{{inviterName}} has invited you to join the DNA implementation team at {{churchName}}!</p>
  <p>As a church leader in DNA Hub, you'll have access to:</p>
  <ul style="color: #5A6577; line-height: 1.8;">
    <li><strong>Implementation Dashboard</strong> \u2014 Track your church's DNA journey milestones</li>
    <li><strong>DNA Training</strong> \u2014 Flow Assessment, DNA Manual, and Launch Guide</li>
    <li><strong>DNA Groups</strong> \u2014 Manage and track discipleship groups</li>
  </ul>
  <p><strong>Your account is ready!</strong> Click the button below to create your password and get started. This link is for your account only \u2014 it expires in 24 hours.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{loginUrl}}" style="background: #D4A853; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Set Up My Account</a>
  </div>
  <p style="color: #5A6577; font-size: 14px;">Prefer Google? You can also sign in at <a href="https://dnadiscipleship.com/login" style="color: #2D6A6A;">dnadiscipleship.com/login</a> using <strong>Continue with Google</strong> \u2014 just make sure to use this email address: <strong>{{email}}</strong></p>
  <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />
  <p style="color: #5A6577; font-size: 14px;">Making disciples who make disciples,<br><strong>ARK Identity Team</strong></p>
  <p style="color: #5A6577; font-size: 14px;">Questions? Reply to this email or contact <a href="mailto:info@dnadiscipleship.com" style="color: #2D6A6A;">info@dnadiscipleship.com</a></p>
</div>`;

const assessmentNotificationHtml = `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">New Church Assessment Submitted</h2>
  <div style="background: #F4E7D7; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0;"><strong>Church:</strong> {{churchName}}</p>
    <p style="margin: 0 0 10px 0;"><strong>Contact:</strong> {{contactName}}</p>
    <p style="margin: 0;"><strong>Email:</strong> {{contactEmail}}</p>
  </div>
  <p>Review their assessment and schedule a strategy call.</p>
  <p style="color: #5A6577; font-size: 14px; margin-top: 30px;">\u2014 DNA Church Hub</p>
</div>`;

const milestoneNotificationHtml = `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Key Milestone Completed!</h2>
  <div style="background: #F4E7D7; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0;"><strong>Church:</strong> {{churchName}}</p>
    <p style="margin: 0 0 10px 0;"><strong>Phase:</strong> {{phaseName}}</p>
    <p style="margin: 0 0 10px 0;"><strong>Milestone:</strong> {{milestoneName}}</p>
    <p style="margin: 0;"><strong>Completed by:</strong> {{completedBy}}</p>
  </div>
  <p>Consider reaching out to celebrate and encourage them!</p>
  <p style="color: #5A6577; font-size: 14px; margin-top: 30px;">\u2014 DNA Church Hub</p>
</div>`;

const phaseCompletionNotificationHtml = `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Phase {{phaseNumber}} Completed!</h2>
  <div style="background: #4A9E7F; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0; font-size: 18px;"><strong>{{churchName}}</strong></p>
    <p style="margin: 0;">Has completed <strong>{{phaseName}}</strong></p>
  </div>
  <p>They've unlocked the next phase and are ready to continue their DNA journey.</p>
  <p>This is a great time to check in and celebrate their progress!</p>
  <p style="color: #5A6577; font-size: 14px; margin-top: 30px;">\u2014 DNA Church Hub</p>
</div>`;

const serviceCoordinatorHtml = `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Service Follow-Up: {{serviceTitle}}</h2>
  <p style="color: #5A6577;">{{serviceDate}}</p>
  <div style="background: #F4E7D7; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #1A2332; margin: 0 0 12px 0;">People who responded ({{count}}):</h3>
    <p style="color: #5A6577; font-size: 14px;">Each person's full response set is included below and in the attached CSV.</p>
  </div>
  <div style="border: 1px solid #E8DDD0; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <p style="margin: 0 0 4px 0;"><strong>{{personName}}</strong></p>
    <p style="margin: 0 0 4px 0; color: #5A6577; font-size: 14px;">{{personEmail}} \u00b7 {{personPhone}}</p>
    <p style="margin: 8px 0 0 0; color: #5A6577; font-size: 14px;">Next Step: "I want to join a DNA group"</p>
  </div>
  <p style="color: #5A6577; font-size: 14px; margin-top: 30px;">\u2014 DNA Church Hub<br>A CSV with all responses is attached to this email.</p>
</div>`;

const serviceMasterSummaryHtml = `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Service Summary: {{serviceTitle}}</h2>
  <p style="color: #5A6577;">{{serviceDate}}</p>
  <div style="background: #1A2332; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #D4A853; margin: 0 0 12px 0;">All Responses ({{totalCount}})</h3>
    <p style="margin: 0; color: #E8E8E8;">Complete summary of all people who responded during the service.</p>
  </div>
  <div style="border: 1px solid #E8DDD0; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <p style="margin: 0 0 4px 0;"><strong>{{personName}}</strong></p>
    <p style="margin: 0 0 4px 0; color: #5A6577; font-size: 14px;">{{personEmail}} \u00b7 {{personPhone}}</p>
    <ul style="color: #5A6577; font-size: 14px; margin: 8px 0 0 0; padding-left: 20px;">
      <li>Next Step: "I want to join a DNA group"</li>
      <li>Announcement Sign-up: "Marriage Retreat"</li>
    </ul>
  </div>
  <p style="color: #5A6577; font-size: 14px; margin-top: 30px;">\u2014 DNA Church Hub<br>A CSV with all responses is attached to this email.</p>
</div>`;

// ─── Section Data ─────────────────────────────────────────────────────────────

const sections: Section[] = [
  {
    label: 'Training',
    badge: 'Auth Required',
    badgeColor: 'bg-orange-100 text-orange-800',
    headerColor: 'bg-gold/10 text-gold border-gold/30',
    items: [
      {
        title: 'Training Dashboard',
        description: 'DNA leader training -- flow assessment, manual sessions, launch guide',
        href: '/training',
        icon: GraduationCap,
        color: 'bg-gold/10 text-gold',
        requiresAuth: true,
        emails: [
          {
            id: 'training-welcome',
            name: 'Training Welcome',
            subject: 'Welcome to DNA Training',
            trigger: 'New leader account created and assigned training_participant role',
            variables: ['name', 'loginLink'],
            html: trainingWelcomeHtml,
          },
          {
            id: 'training-login',
            name: 'Training Login',
            subject: 'Access Your DNA Training Dashboard',
            trigger: 'Leader requests magic link from training login page',
            variables: ['name', 'loginLink'],
            html: trainingLoginHtml,
          },
          {
            id: 'assessment-complete',
            name: 'Assessment Complete',
            subject: 'Assessment Complete! DNA Manual Unlocked',
            trigger: 'Leader completes the Flow Assessment',
            variables: ['name', 'dashboardLink'],
            html: assessmentCompleteHtml,
          },
          {
            id: 'dna-leader-reminder',
            name: 'DNA Leader Reminder',
            subject: 'Your account is ready -- let\'s get started!',
            trigger: 'Church leader sends reminder to a DNA leader who hasn\'t started training',
            variables: ['firstName', 'fromName', 'churchName', 'loginUrl'],
            html: dnaLeaderReminderHtml,
          },
        ],
      },
    ],
  },
  {
    label: 'Groups',
    badge: 'Auth Required',
    badgeColor: 'bg-orange-100 text-orange-800',
    headerColor: 'bg-teal/10 text-teal border-teal/30',
    items: [
      {
        title: 'Groups Dashboard',
        description: 'DNA leader groups -- create and manage DNA discipleship groups, track disciples',
        href: '/groups',
        icon: Users,
        color: 'bg-teal/10 text-teal',
        requiresAuth: true,
        emails: [
          {
            id: 'dna-leader-direct-invite',
            name: 'DNA Leader Direct Invite',
            subject: 'You\'ve been invited to become a DNA leader!',
            trigger: 'Church leader invites a new DNA leader (direct account creation)',
            variables: ['leaderName', 'inviterName', 'churchName', 'loginUrl', 'email'],
            html: dnaLeaderDirectInviteHtml,
          },
          {
            id: 'dna-leader-invitation',
            name: 'DNA Leader Invitation',
            subject: 'You\'ve been invited to become a DNA leader!',
            trigger: 'Church leader sends invitation link to potential DNA leader',
            variables: ['leaderName', 'inviterName', 'churchName', 'signupUrl'],
            html: dnaLeaderInvitationHtml,
          },
          {
            id: 'dna-leader-magic-link',
            name: 'DNA Leader Magic Link',
            subject: 'Access Your DNA Groups Dashboard',
            trigger: 'DNA leader requests login magic link for groups dashboard',
            variables: ['name', 'magicLink'],
            html: dnaLeaderMagicLinkHtml,
          },
          {
            id: 'co-leader-invitation',
            name: 'Co-Leader Invitation',
            subject: 'Co-Leader Invitation: {{groupName}}',
            trigger: 'DNA leader invites an existing user to co-lead their group',
            variables: ['leaderName', 'inviterName', 'groupName', 'acceptUrl', 'declineUrl'],
            html: coLeaderInvitationHtml,
          },
          {
            id: 'co-leader-new-user-invite',
            name: 'Co-Leader New User Invite',
            subject: 'You\'ve Been Invited to Co-Lead a DNA Group!',
            trigger: 'DNA leader invites a new user (no account) to co-lead their group',
            variables: ['leaderName', 'inviterName', 'groupName', 'signupUrl', 'existingAccountUrl'],
            html: coLeaderNewUserInviteHtml,
          },
          {
            id: 'daily-dna-invitation',
            name: 'Daily DNA Invitation',
            subject: 'Welcome to Daily DNA!',
            trigger: 'Leader adds a disciple to a group and sends app invitation',
            variables: ['discipleName', 'leaderName', 'groupName', 'appUrl', 'email'],
            html: dailyDnaInvitationHtml,
          },
          {
            id: 'church-leader-invite',
            name: 'Church Leader Invite',
            subject: 'Join the DNA Team at {{churchName}}',
            trigger: 'Admin or church leader invites another church leader',
            variables: ['leaderName', 'inviterName', 'churchName', 'loginUrl', 'email'],
            html: churchLeaderInviteHtml,
          },
        ],
      },
      {
        title: 'Group Signup -- Disciple',
        description: 'Disciple-facing signup page to join a DNA group via shared link',
        href: '/groups/signup',
        icon: UserPlus,
        color: 'bg-teal/10 text-teal',
      },
    ],
  },
  {
    label: 'Cohort',
    badge: 'Auth Required',
    badgeColor: 'bg-orange-100 text-orange-800',
    headerColor: 'bg-navy/10 text-navy border-navy/30',
    items: [
      {
        title: 'Cohort',
        description: 'DNA cohort -- feed, members, calendar, discussion for DNA leaders',
        href: '/cohort',
        icon: BookOpen,
        color: 'bg-navy/10 text-navy',
        requiresAuth: true,
      },
    ],
  },
  {
    label: 'Admin -- Church Management',
    badge: 'Admin Only',
    badgeColor: 'bg-navy text-white',
    headerColor: 'bg-navy/10 text-navy border-navy/30',
    items: [
      {
        title: 'Admin Panel',
        description: 'Church management dashboard -- view all churches, manage progress, send notifications',
        href: '/admin',
        icon: Building2,
        color: 'bg-navy/10 text-navy',
        requiresAuth: true,
        testHref: '/test/admin',
        emails: [
          {
            id: 'assessment-notification',
            name: 'Assessment Notification',
            subject: 'New Church Assessment Submitted',
            trigger: 'A church completes the readiness assessment',
            variables: ['churchName', 'contactName', 'contactEmail'],
            html: assessmentNotificationHtml,
          },
          {
            id: 'milestone-notification',
            name: 'Milestone Notification',
            subject: 'Key Milestone Completed!',
            trigger: 'A church completes a key implementation milestone',
            variables: ['churchName', 'phaseName', 'milestoneName', 'completedBy'],
            html: milestoneNotificationHtml,
          },
          {
            id: 'phase-completion-notification',
            name: 'Phase Completion Notification',
            subject: 'Phase {{phaseNumber}} Completed!',
            trigger: 'A church completes all milestones in a phase',
            variables: ['churchName', 'phaseName', 'phaseNumber'],
            html: phaseCompletionNotificationHtml,
          },
        ],
      },
      {
        title: 'Dashboard -- Admin View',
        description: 'Dashboard with admin editing privileges for milestone management',
        href: '/dashboard',
        icon: Settings,
        color: 'bg-teal/10 text-teal',
        requiresAuth: true,
        testHref: '/test/dashboard-admin',
      },
      {
        title: 'Church Detail -- Admin',
        description: 'Individual church management with call scheduling and progress tracking',
        href: '/admin/church/[id]',
        icon: Eye,
        color: 'bg-navy/10 text-navy',
        requiresAuth: true,
        testHref: '/test/admin/church',
      },
    ],
  },
  {
    label: 'Live Service',
    badge: 'Feature-Gated',
    badgeColor: 'bg-purple-100 text-purple-800',
    headerColor: 'bg-purple-50 text-purple-800 border-purple-200',
    emails: [
      {
        id: 'service-coordinator',
        name: 'Service Coordinator',
        subject: 'Service Follow-Up: {{serviceTitle}}',
        trigger: 'Automated after live service ends (daily cron) or manual trigger from Hub',
        variables: ['serviceTitle', 'serviceDate', 'count', 'personName', 'personEmail', 'personPhone'],
        html: serviceCoordinatorHtml,
      },
      {
        id: 'service-master-summary',
        name: 'Service Master Summary',
        subject: 'Service Summary: {{serviceTitle}}',
        trigger: 'Automated after live service ends (daily cron) -- sent to service creator',
        variables: ['serviceTitle', 'serviceDate', 'totalCount', 'personName', 'personEmail', 'personPhone'],
        html: serviceMasterSummaryHtml,
      },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmailChipButton({
  email,
  isExpanded,
  onToggle,
}: {
  email: EmailPreview;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 text-xs border px-2.5 py-1 rounded-full transition-colors ${
        isExpanded
          ? 'bg-teal/15 text-teal border-teal/40'
          : 'bg-teal/5 text-teal border-teal/20 hover:bg-teal/10'
      }`}
    >
      <Mail className="w-3 h-3" />
      {email.name}
      {isExpanded ? (
        <ChevronDown className="w-3 h-3" />
      ) : (
        <ChevronRight className="w-3 h-3" />
      )}
    </button>
  );
}

function EmailPreviewPanel({ email }: { email: EmailPreview }) {
  return (
    <div className="border border-card-border rounded-lg overflow-hidden">
      {/* Email metadata */}
      <div className="bg-background p-4 border-b border-card-border">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-xs font-medium text-foreground-muted w-16 flex-shrink-0 pt-0.5">Subject</span>
            <span className="text-sm text-navy font-medium">{email.subject}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-medium text-foreground-muted w-16 flex-shrink-0 pt-0.5">Trigger</span>
            <span className="text-xs text-foreground-muted">{email.trigger}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-medium text-foreground-muted w-16 flex-shrink-0 pt-0.5">Variables</span>
            <div className="flex flex-wrap gap-1">
              {email.variables.map((v) => (
                <code
                  key={v}
                  className="text-xs bg-gold/10 text-gold px-1.5 py-0.5 rounded font-mono"
                >
                  {'{{' + v + '}}'}
                </code>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* HTML preview */}
      <div className="bg-white p-4">
        <div
          className="mx-auto"
          style={{ maxWidth: 600 }}
          dangerouslySetInnerHTML={{ __html: email.html }}
        />
      </div>
    </div>
  );
}

function PageCard({
  item,
  expandedEmail,
  setExpandedEmail,
}: {
  item: PageItem;
  expandedEmail: string | null;
  setExpandedEmail: (id: string | null) => void;
}) {
  const Icon = item.icon;
  const linkHref = item.testHref || item.href;

  return (
    <div className="bg-white border border-card-border rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${item.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-navy text-sm">{item.title}</h3>
            {item.requiresAuth && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">Auth Required</span>
            )}
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">{item.description}</p>
          <p className="text-xs text-teal mt-1 font-mono">{item.href}</p>

          {/* Email chips */}
          {item.emails && item.emails.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {item.emails.map((email) => (
                  <EmailChipButton
                    key={email.id}
                    email={email}
                    isExpanded={expandedEmail === email.id}
                    onToggle={() =>
                      setExpandedEmail(expandedEmail === email.id ? null : email.id)
                    }
                  />
                ))}
              </div>

              {/* Expanded email preview renders below the chip row */}
              {item.emails.map(
                (email) =>
                  expandedEmail === email.id && (
                    <EmailPreviewPanel key={`preview-${email.id}`} email={email} />
                  )
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {item.testHref && (
            <Link
              href={item.testHref}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-teal text-white text-xs rounded hover:bg-teal-light transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Test
            </Link>
          )}
          <Link
            href={linkHref}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-navy text-navy text-xs rounded hover:bg-navy hover:text-white transition-colors"
          >
            {!item.requiresAuth || item.testHref ? (
              <ExternalLink className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            {item.requiresAuth && !item.testHref ? 'Live' : 'View'}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardsTestPage() {
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link
            href="/test"
            className="flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div>
            <p className="text-gold font-medium text-sm tracking-wide">DNA HUB</p>
            <p className="font-semibold">Dashboards & System Pages</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Intro card */}
        <div className="card mb-8">
          <h1 className="text-xl font-semibold text-navy mb-1">
            Dashboards & System Pages
          </h1>
          <p className="text-foreground-muted text-sm">
            All authenticated Hub pages organized by area. Click an email chip below
            any page to expand an inline preview showing the subject, trigger,
            template variables, and rendered HTML.
          </p>
          <div className="flex flex-wrap gap-3 mt-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full">
                Auth Required
              </span>{' '}
              needs login
            </span>
            <span className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-navy text-white rounded-full">
                Admin Only
              </span>{' '}
              admin access
            </span>
            <span className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                Feature-Gated
              </span>{' '}
              per-church toggle
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-teal" /> email chip = expandable
              preview
            </span>
          </div>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.label} className="mb-10">
            {/* Section header */}
            <div
              className={`flex items-center justify-between px-4 py-2.5 rounded-lg border mb-4 ${section.headerColor}`}
            >
              <span className="font-semibold text-sm">{section.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${section.badgeColor}`}
              >
                {section.badge}
              </span>
            </div>

            {/* Page items */}
            {section.items && (
              <div className="space-y-3">
                {section.items.map((item) => (
                  <PageCard
                    key={item.href}
                    item={item}
                    expandedEmail={expandedEmail}
                    setExpandedEmail={setExpandedEmail}
                  />
                ))}
              </div>
            )}

            {/* Section-level emails (Live Service) */}
            {!section.items && section.emails && (
              <div className="bg-white border border-card-border rounded-lg p-4">
                <p className="text-xs text-foreground-muted mb-3">
                  These emails are triggered automatically after live services end.
                  No specific page -- they fire via the daily cron job or manual
                  Hub trigger.
                </p>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {section.emails.map((email) => (
                      <EmailChipButton
                        key={email.id}
                        email={email}
                        isExpanded={expandedEmail === email.id}
                        onToggle={() =>
                          setExpandedEmail(
                            expandedEmail === email.id ? null : email.id
                          )
                        }
                      />
                    ))}
                  </div>
                  {section.emails.map(
                    (email) =>
                      expandedEmail === email.id && (
                        <EmailPreviewPanel
                          key={`preview-${email.id}`}
                          email={email}
                        />
                      )
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
