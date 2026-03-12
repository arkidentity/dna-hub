'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Home,
  CheckCircle,
  FileText,
  Rocket,
  BookOpen,
  Compass,
  LogIn,
  Users,
  Layout,
  Gift,
  Star,
  Mail,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  Clock,
  Monitor,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailTemplate {
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
  emails: string[]; // email template IDs
}

interface FunnelSection {
  id: string;
  number: number;
  label: string;
  color: string;
  borderColor: string;
  pages?: PageItem[];
  followUpEmails?: string[]; // for email-only sections
}

// ─── Email Templates ──────────────────────────────────────────────────────────

const emailTemplates: Record<string, EmailTemplate> = {
  'dna-manual': {
    id: 'dna-manual',
    name: 'DNA Manual Delivery',
    subject: 'Your DNA Multiplication Manual',
    trigger: 'Immediately after landing page signup',
    variables: ['firstName', 'manualUrl'],
    html: `<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 580px; margin: 0 auto; background: #f7f4ef; color: #0f0e0c;">
  <div style="background: #1A2332; padding: 20px 32px; display: flex; align-items: center;">
    <span style="font-family: system-ui, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #D4A853;">DNA Discipleship</span>
  </div>
  <div style="padding: 40px 32px; background: #fdfbf7;">
    <p style="font-family: system-ui, sans-serif; font-size: 16px; line-height: 1.6; color: #0f0e0c; margin: 0 0 20px 0;">Hey {{firstName}},</p>
    <p style="font-family: system-ui, sans-serif; font-size: 16px; line-height: 1.6; color: #6b6560; margin: 0 0 32px 0;">The Multiplication Manual is attached below. Six sessions. Forty-nine pages. The biblical case and the practical framework for moving your church from <em>wanting</em> to make disciples to actually doing it — reproducibly.</p>
    <div style="background: #1A2332; padding: 28px 32px; margin: 0 0 32px 0; text-align: center;">
      <p style="font-family: system-ui, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #D4A853; margin: 0 0 12px 0;">Free Download</p>
      <p style="font-family: Georgia, serif; font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 6px 0;">DNA Multiplication Manual</p>
      <p style="font-family: system-ui, sans-serif; font-size: 13px; color: rgba(255,255,255,0.45); margin: 0 0 20px 0;">6 sessions · 49 pages</p>
      <a href="{{manualUrl}}" style="background: #D4A853; color: #0f0e0c; padding: 14px 28px; text-decoration: none; font-family: system-ui, sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 0.04em; display: inline-block;">Download the Manual (PDF)</a>
    </div>
    <p style="font-family: system-ui, sans-serif; font-size: 15px; line-height: 1.6; color: #0f0e0c; margin: 40px 0 4px 0;">Travis</p>
    <p style="font-family: system-ui, sans-serif; font-size: 13px; color: #6b6560; margin: 0;">DNA Discipleship</p>
    <p style="font-family: system-ui, sans-serif; font-size: 13px; color: #6b6560; margin: 24px 0 0 0; padding-top: 24px; border-top: 1px solid #ddd8cf;">P.S. Have questions? Hit reply. I read every email.</p>
  </div>
  <div style="background: #2a2825; padding: 16px 32px; text-align: center;">
    <p style="font-family: system-ui, sans-serif; font-size: 11px; color: rgba(247,244,239,0.35); margin: 0;">DNA Discipleship · dnadiscipleship.com</p>
  </div>
</div>`,
  },
  '3-steps-ready': {
    id: '3-steps-ready',
    name: '3 Steps Guide — Ready',
    subject: '{{firstName}}, Your Church is Ready to Launch DNA!',
    trigger: 'After assessment submission with "Ready" result',
    variables: ['firstName', 'threeStepsUrl', 'discoveryCallUrl'],
    html: `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hey {{firstName}},</h2>
  <p>Thanks for completing the DNA Church Readiness Assessment!</p>
  <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
    <h3 style="color: #1A2332; margin: 0 0 16px 0;">3 Steps to Becoming a Community That Multiplies</h3>
    <p style="margin: 0 0 20px 0; color: #5A6577;">Your personalized guide based on where your church is right now.</p>
    <a href="{{threeStepsUrl}}" style="background: #D4A853; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Download Your 3 Steps Guide (PDF)</a>
  </div>
  <div style="background: #1A2332; color: white; padding: 24px; border-radius: 8px; margin: 24px 0;">
    <h3 style="color: #D4A853; margin: 0 0 12px 0;">You're Ready to Launch!</h3>
    <p style="margin: 0; color: #E8E8E8;">Your church shows strong alignment for DNA implementation. You have the leadership buy-in and foundation in place to move quickly.</p>
  </div>
  <div style="background: #1A2332; padding: 24px; border-radius: 8px; margin: 16px 0; text-align: center;">
    <h4 style="color: #D4A853; margin: 0 0 8px 0;">Book Your Discovery Call</h4>
    <p style="color: #E8E8E8; margin: 0 0 16px 0; font-size: 14px;">Book your Discovery Call to unlock your DNA Church Dashboard — where you'll find the Launch Guide and everything you need to get started.</p>
    <a href="{{discoveryCallUrl}}" style="background: #D4A853; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Book a Discovery Call (15 min)</a>
  </div>
  <p style="margin-top: 32px;">Travis<br><span style="color: #5A6577;">DNA Discipleship</span></p>
  <p style="color: #5A6577; font-size: 14px; margin-top: 24px;">P.S. Have questions? Just hit reply. I read every email.</p>
</div>`,
  },
  '3-steps-building': {
    id: '3-steps-building',
    name: '3 Steps Guide — Building',
    subject: '{{firstName}}, Your 3 Steps to Multiplying Disciples',
    trigger: 'After assessment submission with "Building" result',
    variables: ['firstName', 'threeStepsUrl', 'discoveryCallUrl', 'dnaManualUrl'],
    html: `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hey {{firstName}},</h2>
  <p>Thanks for completing the DNA Church Assessment!</p>
  <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
    <h3 style="color: #1A2332; margin: 0 0 16px 0;">3 Steps to Becoming a Community That Multiplies</h3>
    <a href="{{threeStepsUrl}}" style="background: #D4A853; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Download Your 3 Steps Guide (PDF)</a>
  </div>
  <div style="background: #1A2332; color: white; padding: 24px; border-radius: 8px; margin: 24px 0;">
    <h3 style="color: #D4A853; margin: 0 0 12px 0;">You're Building the Foundation</h3>
    <p style="margin: 0; color: #E8E8E8;">You're on the right track. There are a few things to align before launching DNA, and we can help you get there.</p>
  </div>
  <div style="background: #F8F9FA; padding: 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2D6A6A;">
    <h4 style="color: #1A2332; margin: 0 0 8px 0;">Read the DNA Manual</h4>
    <p style="color: #5A6577; margin: 0 0 12px 0; font-size: 14px;">Understand the theology and heart behind DNA. Share it with your leadership team.</p>
    <a href="{{dnaManualUrl}}" style="color: #2D6A6A; text-decoration: none; font-weight: 500;">Download DNA Manual &rarr;</a>
  </div>
  <div style="background: #1A2332; padding: 24px; border-radius: 8px; margin: 16px 0; text-align: center;">
    <h4 style="color: #D4A853; margin: 0 0 8px 0;">Book Your Discovery Call</h4>
    <p style="color: #E8E8E8; margin: 0 0 16px 0; font-size: 14px;">Book your Discovery Call and we'll unlock the DNA Launch Guide in your Church Dashboard.</p>
    <a href="{{discoveryCallUrl}}" style="background: #D4A853; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Book a Discovery Call (15 min)</a>
  </div>
  <p style="margin-top: 32px;">Travis<br><span style="color: #5A6577;">DNA Discipleship</span></p>
  <p style="color: #5A6577; font-size: 14px; margin-top: 24px;">P.S. Have questions? Just hit reply. I read every email.</p>
</div>`,
  },
  '3-steps-exploring': {
    id: '3-steps-exploring',
    name: '3 Steps Guide — Exploring',
    subject: '{{firstName}}, Your 3 Steps to Multiplying Disciples',
    trigger: 'After assessment submission with "Exploring" result',
    variables: ['firstName', 'threeStepsUrl', 'discoveryCallUrl', 'dnaManualUrl'],
    html: `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hey {{firstName}},</h2>
  <p>Thanks for completing the DNA Church Assessment!</p>
  <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
    <h3 style="color: #1A2332; margin: 0 0 16px 0;">3 Steps to Becoming a Community That Multiplies</h3>
    <a href="{{threeStepsUrl}}" style="background: #D4A853; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Download Your 3 Steps Guide (PDF)</a>
  </div>
  <div style="background: #1A2332; color: white; padding: 24px; border-radius: 8px; margin: 24px 0;">
    <h3 style="color: #D4A853; margin: 0 0 12px 0;">You're in Discovery Mode</h3>
    <p style="margin: 0; color: #E8E8E8;">DNA might be a good fit down the road. Start by understanding the vision and sharing it with your team.</p>
  </div>
  <div style="background: #F8F9FA; padding: 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2D6A6A;">
    <h4 style="color: #1A2332; margin: 0 0 8px 0;">Read the DNA Manual</h4>
    <p style="color: #5A6577; margin: 0 0 12px 0; font-size: 14px;">Start with the 'why' behind multiplication discipleship before the 'how'.</p>
    <a href="{{dnaManualUrl}}" style="color: #2D6A6A; text-decoration: none; font-weight: 500;">Download DNA Manual &rarr;</a>
  </div>
  <div style="background: #1A2332; padding: 24px; border-radius: 8px; margin: 16px 0; text-align: center;">
    <h4 style="color: #D4A853; margin: 0 0 8px 0;">Book Your Discovery Call</h4>
    <p style="color: #E8E8E8; margin: 0 0 16px 0; font-size: 14px;">Let's discuss your path forward together on a 15-minute Discovery Call.</p>
    <a href="{{discoveryCallUrl}}" style="background: #D4A853; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Book a Discovery Call (15 min)</a>
  </div>
  <p style="margin-top: 32px;">Travis<br><span style="color: #5A6577;">DNA Discipleship</span></p>
  <p style="color: #5A6577; font-size: 14px; margin-top: 24px;">P.S. Have questions? Just hit reply. I read every email.</p>
</div>`,
  },
  'discovery-call-access': {
    id: 'discovery-call-access',
    name: 'Discovery Call — Dashboard Access',
    subject: '{{firstName}}, Your DNA Dashboard is Ready!',
    trigger: 'After booking a discovery call (fires on book-call page load)',
    variables: ['firstName', 'churchName', 'magicLink'],
    html: `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hey {{firstName}},</h2>
  <p>You just took a big step by booking a Discovery Call — I'm looking forward to connecting with you!</p>
  <p>In the meantime, I've unlocked your DNA Church Dashboard. Log in now and you'll find the DNA Launch Guide waiting for you inside.</p>
  <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
    <h3 style="color: #1A2332; margin: 0 0 8px 0;">Your Church Dashboard is Ready</h3>
    <p style="color: #5A6577; margin: 0 0 4px 0; font-size: 14px;">Inside you'll find the <strong>DNA Launch Guide</strong> and everything you need to prepare for our call.</p>
    <p style="color: #5A6577; margin: 0 0 20px 0; font-size: 14px;">You can also track {{churchName}}'s implementation journey and manage your leadership team.</p>
    <a href="{{magicLink}}" style="background: #D4A853; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block; font-size: 16px;">Log In to Your Dashboard</a>
  </div>
  <p style="color: #5A6577; font-size: 14px;">Your login link is valid for 7 days. After that, visit <a href="https://dnadiscipleship.com/login" style="color: #2D6A6A;">dnadiscipleship.com/login</a> to request a new one.</p>
  <p style="margin-top: 32px;">Travis<br><span style="color: #5A6577;">DNA Discipleship</span></p>
  <p style="color: #5A6577; font-size: 14px; margin-top: 24px;">P.S. Have questions before our call? Just hit reply — I read every email.</p>
</div>`,
  },
  'magic-link': {
    id: 'magic-link',
    name: 'Magic Link Login',
    subject: 'Your DNA Dashboard Login Link',
    trigger: 'When a user requests a login link from /login',
    variables: ['name', 'magicLink'],
    html: `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hi {{name}},</h2>
  <p>Click the button below to access your DNA Church Dashboard:</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{magicLink}}" style="background: #D4A853; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Access Dashboard</a>
  </div>
  <p style="color: #5A6577; font-size: 14px;">This link expires in 7 days. If you didn't request this, you can safely ignore this email.</p>
  <p style="color: #5A6577; font-size: 14px;">Or copy this link: <br><a href="{{magicLink}}" style="color: #2D6A6A;">{{magicLink}}</a></p>
  <p style="color: #5A6577; font-size: 14px; margin-top: 30px;">— DNA Church Hub</p>
</div>`,
  },
  'proposal-ready': {
    id: 'proposal-ready',
    name: 'Proposal Ready',
    subject: '{{firstName}}, Your DNA Proposal for {{churchName}} is Ready',
    trigger: 'Admin sends proposal after discovery call',
    variables: ['firstName', 'churchName', 'portalUrl', 'proposalCallUrl'],
    html: `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hey {{firstName}},</h2>
  <p>Great news! Following our discovery call, I've put together a customized DNA implementation proposal for {{churchName}}.</p>
  <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0;">
    <h3 style="color: #1A2332; margin: 0 0 12px 0;">Your Proposal is Ready</h3>
    <p style="margin: 0 0 16px 0;">View your proposal and all your discovery notes in your portal:</p>
    <a href="{{portalUrl}}" style="background: #D4A853; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">View Your Portal</a>
  </div>
  <h3 style="color: #1A2332;">Next Step: Proposal Review Call</h3>
  <p>Book a 30-minute call to walk through the proposal together. I'll answer any questions and we can discuss which tier makes the most sense for {{churchName}}.</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{proposalCallUrl}}" style="background: #2D6A6A; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Book Proposal Review Call (30 min)</a>
  </div>
  <p style="margin-top: 32px;">Travis<br><span style="color: #5A6577;">DNA Discipleship</span></p>
</div>`,
  },
  'agreement-confirmed': {
    id: 'agreement-confirmed',
    name: 'Agreement Confirmed',
    subject: 'Welcome to DNA, {{firstName}}! {{churchName}} is Official',
    trigger: 'After church leader signs the agreement',
    variables: ['firstName', 'churchName', 'tierName', 'portalUrl', 'strategyCallUrl'],
    html: `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hey {{firstName}}!</h2>
  <div style="background: #4A9E7F; color: white; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
    <h3 style="margin: 0 0 8px 0;">Welcome to DNA!</h3>
    <p style="margin: 0; font-size: 18px;">{{churchName}} is now part of the DNA family</p>
  </div>
  <p>I'm excited to partner with you on this journey. You've chosen the <strong>{{tierName}}</strong> tier, and I can't wait to see how God uses DNA at {{churchName}}.</p>
  <h3 style="color: #1A2332;">Your Agreement</h3>
  <p>Your signed agreement and all documents are available in your portal:</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{portalUrl}}" style="background: #D4A853; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">View Your Portal</a>
  </div>
  <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />
  <h3 style="color: #1A2332;">Final Step: Strategy Call</h3>
  <p>Let's schedule a 60-minute strategy call to:</p>
  <ul style="color: #5A6577;"><li>Create your customized implementation timeline</li><li>Identify your first DNA group leaders</li><li>Set you up with full dashboard access</li><li>Answer any final questions</li></ul>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{strategyCallUrl}}" style="background: #2D6A6A; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Book Strategy Call (60 min)</a>
  </div>
  <p style="margin-top: 32px;">Travis<br><span style="color: #5A6577;">DNA Discipleship</span></p>
</div>`,
  },
  'dashboard-access': {
    id: 'dashboard-access',
    name: 'Dashboard Access',
    subject: '{{firstName}}, Your DNA Dashboard is Live!',
    trigger: 'After strategy call — full dashboard access granted',
    variables: ['firstName', 'churchName', 'dashboardUrl'],
    html: `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hey {{firstName}}!</h2>
  <div style="background: #1A2332; color: white; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
    <h3 style="color: #D4A853; margin: 0 0 8px 0;">Your Dashboard is Live!</h3>
    <p style="margin: 0;">Full access to {{churchName}}'s DNA implementation hub</p>
  </div>
  <p>Following our strategy call, you now have full access to your DNA Dashboard. This is your home base for the entire implementation journey.</p>
  <h3 style="color: #1A2332;">What You Can Do:</h3>
  <ul style="color: #5A6577;"><li><strong>Track Progress</strong> - See your journey through all 5 phases</li><li><strong>Access Resources</strong> - Download materials for each milestone</li><li><strong>Mark Milestones</strong> - Check off completed items as you go</li><li><strong>Upload Documents</strong> - Store your church's DNA documents</li><li><strong>Export Calendar</strong> - Add milestones to your calendar</li></ul>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{dashboardUrl}}" style="background: #D4A853; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block; font-size: 18px;">Access Your Dashboard</a>
  </div>
  <p style="background: #F4E7D7; padding: 16px; border-radius: 8px;"><strong>Bookmark this link</strong> - You can always request a new login link from the login page, but bookmarking makes access easy.</p>
  <p style="margin-top: 32px;">Let's multiply disciples together!</p>
  <p>Travis<br><span style="color: #5A6577;">DNA Discipleship</span></p>
</div>`,
  },
  'book-discovery-reminder': {
    id: 'book-discovery-reminder',
    name: 'Book Discovery Reminder',
    subject: '{{firstName}}, let\'s schedule your Discovery Call',
    trigger: '3 days after assessment, no call booked',
    variables: ['firstName', 'churchName', 'discoveryCallUrl'],
    html: `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hey {{firstName}},</h2>
  <p>A few days ago, you completed the DNA Church Assessment for {{churchName}}. I noticed you haven't booked your Discovery Call yet.</p>
  <p>This is a quick 15-minute conversation where we'll:</p>
  <ul style="color: #5A6577;"><li>Discuss your assessment results</li><li>Answer any questions you have about DNA</li><li>Explore if DNA is the right fit for {{churchName}}</li></ul>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{discoveryCallUrl}}" style="background: #D4A853; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Book Your Discovery Call (15 min)</a>
  </div>
  <p style="color: #5A6577;">No pressure—just a friendly conversation to see if we're a good fit to partner together.</p>
  <p style="margin-top: 32px;">Travis<br><span style="color: #5A6577;">DNA Discipleship</span></p>
</div>`,
  },
  'call-reminder-24h': {
    id: 'call-reminder-24h',
    name: 'Call Reminder (24h)',
    subject: 'Reminder: {{callName}} Tomorrow - {{churchName}}',
    trigger: '24 hours before scheduled call',
    variables: ['firstName', 'churchName', 'callName', 'duration', 'formattedDate'],
    html: `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hey {{firstName}},</h2>
  <p>Just a friendly reminder that we have a call scheduled!</p>
  <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0;">
    <h3 style="color: #1A2332; margin: 0 0 12px 0;">{{callName}}</h3>
    <p style="margin: 0 0 8px 0;"><strong>When:</strong> {{formattedDate}}</p>
    <p style="margin: 0 0 8px 0;"><strong>Duration:</strong> {{duration}}</p>
    <p style="margin: 0;"><strong>Church:</strong> {{churchName}}</p>
  </div>
  <p>Looking forward to connecting with you!</p>
  <p style="color: #5A6577; font-size: 14px; margin-top: 24px;">Need to reschedule? Just reply to this email and we'll find a new time.</p>
  <p style="margin-top: 32px;">Travis<br><span style="color: #5A6577;">DNA Discipleship</span></p>
</div>`,
  },
  'call-missed': {
    id: 'call-missed',
    name: 'Call Missed',
    subject: 'We missed you! Let\'s reschedule - {{churchName}}',
    trigger: '1-2 days after missed call',
    variables: ['firstName', 'churchName', 'callName', 'rescheduleUrl'],
    html: `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hey {{firstName}},</h2>
  <p>I noticed we weren't able to connect for our {{callName}} yesterday. No worries—I know things come up!</p>
  <p>Let's find a new time that works better for you:</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{rescheduleUrl}}" style="background: #D4A853; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Reschedule {{callName}}</a>
  </div>
  <p style="color: #5A6577;">If your schedule has changed and you need more flexibility, just reply to this email and we'll work something out.</p>
  <p style="margin-top: 32px;">Travis<br><span style="color: #5A6577;">DNA Discipleship</span></p>
</div>`,
  },
  'proposal-expiring': {
    id: 'proposal-expiring',
    name: 'Proposal Expiring',
    subject: 'Your DNA Proposal - Next Steps? - {{churchName}}',
    trigger: '7 days after proposal sent',
    variables: ['firstName', 'churchName', 'portalUrl', 'proposalCallUrl'],
    html: `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hey {{firstName}},</h2>
  <p>I sent over the DNA implementation proposal for {{churchName}} about a week ago. I wanted to check in and see if you've had a chance to review it.</p>
  <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0;">
    <h3 style="color: #1A2332; margin: 0 0 12px 0;">Your Proposal is Waiting</h3>
    <p style="margin: 0 0 16px 0;">View your customized proposal and all discovery notes in your portal:</p>
    <a href="{{portalUrl}}" style="background: #2D6A6A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">View Proposal</a>
  </div>
  <p>Have questions? Let's hop on a quick call to walk through it together:</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="{{proposalCallUrl}}" style="background: #D4A853; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Book Proposal Review Call (30 min)</a>
  </div>
  <p style="color: #5A6577;">If DNA isn't the right fit right now, no worries at all. Just let me know and I'll keep you in the loop for future resources.</p>
  <p style="margin-top: 32px;">Travis<br><span style="color: #5A6577;">DNA Discipleship</span></p>
</div>`,
  },
  'inactive-reminder': {
    id: 'inactive-reminder',
    name: 'Inactive Reminder',
    subject: 'Checking in on {{churchName}}\'s DNA Journey',
    trigger: '14 days no progress',
    variables: ['firstName', 'churchName', 'phaseName', 'dashboardUrl'],
    html: `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hey {{firstName}},</h2>
  <p>I noticed it's been a couple weeks since we've seen activity on {{churchName}}'s DNA dashboard. Just wanted to check in and see how things are going!</p>
  <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0;">
    <h3 style="color: #1A2332; margin: 0 0 8px 0;">Current Status</h3>
    <p style="margin: 0; color: #5A6577;">{{churchName}} is in <strong>{{phaseName}}</strong></p>
  </div>
  <p>Is there anything I can help with? Common reasons churches pause:</p>
  <ul style="color: #5A6577;"><li>Busy season at church (totally understandable!)</li><li>Questions about next steps</li><li>Need help with a specific milestone</li><li>Leadership transitions</li></ul>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{dashboardUrl}}" style="background: #D4A853; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Continue Your Journey</a>
  </div>
  <p>Just reply to this email if you'd like to hop on a quick call to troubleshoot or adjust your timeline.</p>
  <p style="margin-top: 32px;">Travis<br><span style="color: #5A6577;">DNA Discipleship</span></p>
</div>`,
  },
  'demo-invite': {
    id: 'demo-invite',
    name: 'Demo Invite',
    subject: '{{firstName}}, I built something for {{churchName}}',
    trigger: 'Admin sends demo invite',
    variables: ['firstName', 'churchName', 'demoUrl'],
    html: `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hey {{firstName}},</h2>
  <p style="color: #3D4A5C; font-size: 15px; line-height: 1.7;">I've been working on something for <strong>{{churchName}}</strong> and I'm excited to show you.</p>
  <p style="color: #3D4A5C; font-size: 15px; line-height: 1.7;">I built a personalized discipleship app — branded with your church's name and colors — along with a leader dashboard where you can manage groups, connect with other leaders, and track discipleship progress. It's completely free to explore.</p>
  <div style="background: #1A2332; padding: 24px; border-radius: 10px; margin: 28px 0;">
    <h3 style="color: #D4A853; margin: 0 0 16px 0; font-size: 16px;">Here's what you'll see:</h3>
    <ul style="color: #E8E8E8; margin: 0; padding-left: 20px; font-size: 14px; line-height: 2;">
      <li><strong style="color: #D4A853;">Your Branded App</strong> — 3D Journal, 4D Prayer, and the full DNA Pathway</li>
      <li><strong style="color: #D4A853;">Leader Dashboard</strong> — manage groups, peer-to-peer cohort, and training</li>
      <li><strong style="color: #D4A853;">Church Branding</strong> — {{churchName}}'s name and colors throughout</li>
    </ul>
  </div>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{demoUrl}}" style="background: #D4A853; color: #1A2332; padding: 16px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">See Your Demo</a>
  </div>
  <p style="color: #3D4A5C; font-size: 15px; line-height: 1.7;">Take a few minutes to click around — I think you'll be surprised at how much is already built for {{churchName}}. No login required, no commitment. Just a look at what's possible.</p>
  <p style="color: #3D4A5C; font-size: 15px; line-height: 1.7;">If you have any questions, just hit reply. I'd love to hear what you think.</p>
  <p style="margin-top: 32px; color: #1A2332;">Travis<br><span style="color: #5A6577;">DNA Discipleship</span></p>
  <p style="color: #5A6577; font-size: 14px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #E8DDD0;">P.S. This demo was built specifically for {{churchName}}. Hit reply if you want me to walk you through it.</p>
</div>`,
  },
  'assessment-invite': {
    id: 'assessment-invite',
    name: 'Assessment Invite',
    subject: '{{firstName}}, the next step for {{churchName}}',
    trigger: 'Admin moves church from demo to pending_assessment',
    variables: ['firstName', 'churchName', 'assessmentUrl', 'coachName'],
    html: `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1A2332;">Hi {{firstName}},</h2>
  <p>It was great connecting with you about DNA Discipleship. I'm excited about what God could do through <strong>{{churchName}}</strong> — and I think you're closer to being ready than you might think.</p>
  <p>The next step is a short church profile form. It helps me understand where your church is at so we can have a much more focused conversation. It takes about 5 minutes.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{assessmentUrl}}" style="background: #D4A853; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">Fill Out the Church Profile &rarr;</a>
  </div>
  <p style="color: #5A6577; font-size: 14px;">Or copy this link: <a href="{{assessmentUrl}}" style="color: #2D6A6A;">{{assessmentUrl}}</a></p>
  <p>Once you submit it, I'll review it personally and reach out to schedule a discovery conversation. Looking forward to it.</p>
  <hr style="border: none; border-top: 1px solid #E8DDD0; margin: 32px 0;" />
  <p style="color: #5A6577; font-size: 14px;">Making disciples who make disciples,<br><strong>{{coachName}}</strong><br>DNA Coach</p>
  <p style="color: #5A6577; font-size: 14px;">Questions? Just reply to this email.<br><a href="https://dnadiscipleship.com" style="color: #2D6A6A;">dnadiscipleship.com</a></p>
</div>`,
  },
};

// ─── Funnel Data ──────────────────────────────────────────────────────────────

const funnelSections: FunnelSection[] = [
  {
    id: 'main',
    number: 1,
    label: 'Main Funnel — DNA Manual & Church Assessment',
    color: 'bg-gold/10 text-gold',
    borderColor: 'border-gold/30',
    pages: [
      {
        title: 'Landing Page',
        description: 'Public landing page — church leaders sign up to receive the DNA Manual',
        href: '/',
        icon: Home,
        color: 'bg-navy/10 text-navy',
        emails: ['dna-manual'],
      },
      {
        title: 'Manual Signup Confirmation',
        description: '"Check your inbox" confirmation shown after signing up on the landing page',
        href: '/thank-you',
        icon: CheckCircle,
        color: 'bg-success/10 text-success',
        emails: [],
      },
      {
        title: 'Church Assessment',
        description: '5-minute questionnaire to evaluate church readiness for DNA',
        href: '/assessment',
        icon: FileText,
        color: 'bg-gold/10 text-gold',
        emails: ['3-steps-ready', '3-steps-building', '3-steps-exploring'],
      },
      {
        title: 'Assessment Confirmation — Ready',
        description: 'Post-assessment page for churches ready to launch — book a discovery call to receive dashboard access + Launch Guide',
        href: '/assessment/thank-you?level=ready&church=Test%20Church',
        icon: Rocket,
        color: 'bg-success/10 text-success',
        emails: ['discovery-call-access'],
      },
      {
        title: 'Assessment Confirmation — Building',
        description: 'Post-assessment page for churches building their foundation',
        href: '/assessment/thank-you?level=building&church=Test%20Church',
        icon: BookOpen,
        color: 'bg-gold/10 text-gold',
        emails: ['discovery-call-access'],
      },
      {
        title: 'Assessment Confirmation — Exploring',
        description: 'Post-assessment page for churches in discovery mode',
        href: '/assessment/thank-you?level=exploring&church=Test%20Church',
        icon: Compass,
        color: 'bg-teal/10 text-teal',
        emails: ['discovery-call-access'],
      },
      {
        title: 'Book a Discovery Call',
        description: 'Dedicated booking page — fires API on load (grants dashboard access + sends magic link email), shows Google Calendar embed + confirmation banner',
        href: '/assessment/book-call?level=ready&church=Test%20Church&email=test@example.com&name=Test',
        icon: CheckCircle,
        color: 'bg-gold/10 text-gold',
        emails: ['discovery-call-access'],
      },
      {
        title: 'Login Page',
        description: 'Magic link login — church leaders enter email to receive access link',
        href: '/login',
        icon: LogIn,
        color: 'bg-navy/10 text-navy',
        emails: ['magic-link'],
      },
      {
        title: 'Portal — Pre-Implementation',
        description: 'Pre-implementation portal for churches awaiting activation',
        href: '/portal',
        icon: Users,
        color: 'bg-purple-100 text-purple-800',
        requiresAuth: true,
        testHref: '/test/portal',
        emails: ['proposal-ready', 'agreement-confirmed'],
      },
      {
        title: 'Onboarding Success',
        description: 'Welcome page shown after strategy call completion',
        href: '/onboarding',
        icon: CheckCircle,
        color: 'bg-success/10 text-success',
        emails: ['dashboard-access'],
      },
      {
        title: 'Church Leader Dashboard',
        description: 'Main implementation dashboard — phases, milestones, resources',
        href: '/dashboard',
        icon: Layout,
        color: 'bg-gold/10 text-gold',
        requiresAuth: true,
        testHref: '/test/dashboard',
        emails: [],
      },
    ],
  },
  {
    id: 'follow-ups',
    number: 2,
    label: 'Automated Follow-ups (Cron-Triggered)',
    color: 'bg-navy/10 text-navy',
    borderColor: 'border-navy/20',
    followUpEmails: [
      'book-discovery-reminder',
      'call-reminder-24h',
      'call-missed',
      'proposal-expiring',
      'inactive-reminder',
    ],
  },
  {
    id: 'gifts',
    number: 3,
    label: 'Spiritual Gifts Funnel',
    color: 'bg-purple-100 text-purple-800',
    borderColor: 'border-purple-200',
    pages: [
      {
        title: 'Spiritual Gifts Assessment',
        description: 'Public landing and assessment flow for the Ministry Gift Test',
        href: '/ministry-gift-test',
        icon: Gift,
        color: 'bg-purple-100 text-purple-800',
        emails: [],
      },
      {
        title: 'Spiritual Gifts Confirmation',
        description: 'Post-submission confirmation page after completing the Spiritual Gifts test',
        href: '/ministry-gift-test/confirmation',
        icon: Star,
        color: 'bg-purple-100 text-purple-800',
        emails: [],
      },
    ],
  },
  {
    id: 'demo',
    number: 4,
    label: 'Demo Funnel',
    color: 'bg-teal/10 text-teal',
    borderColor: 'border-teal/20',
    followUpEmails: ['demo-invite', 'assessment-invite'],
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function EmailChip({
  emailId,
  expanded,
  onToggle,
}: {
  emailId: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const template = emailTemplates[emailId];
  if (!template) return null;

  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
        expanded
          ? 'bg-teal text-white'
          : 'bg-teal/10 text-teal border border-teal/20 hover:bg-teal/20'
      }`}
    >
      <Mail className="w-3 h-3" />
      <span>{template.name}</span>
      {expanded ? (
        <ChevronDown className="w-3 h-3" />
      ) : (
        <ChevronRight className="w-3 h-3" />
      )}
    </button>
  );
}

function EmailPreview({ emailId }: { emailId: string }) {
  const template = emailTemplates[emailId];
  if (!template) return null;

  return (
    <div className="mt-3 bg-white border border-card-border rounded-lg overflow-hidden animate-in slide-in-from-top-2">
      {/* Email preview header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-card-border">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Mail className="w-4 h-4 text-teal" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-navy">{template.name}</p>
            <p className="text-xs text-foreground-muted mt-0.5">
              <span className="font-medium">Subject:</span> {template.subject}
            </p>
            <p className="text-xs text-foreground-muted mt-0.5">
              <span className="font-medium">Trigger:</span> {template.trigger}
            </p>
            {template.variables.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {template.variables.map((v) => (
                  <code
                    key={v}
                    className="text-xs bg-gold/10 text-gold px-1.5 py-0.5 rounded font-mono"
                  >
                    {`{{${v}}}`}
                  </code>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email HTML preview */}
      <div className="p-4 bg-white">
        <div className="border border-gray-200 rounded-lg p-4 max-h-[500px] overflow-y-auto">
          <div dangerouslySetInnerHTML={{ __html: template.html }} />
        </div>
      </div>
    </div>
  );
}

function PageCard({
  page,
  index,
  expandedEmail,
  onToggleEmail,
}: {
  page: PageItem;
  index: number;
  expandedEmail: string | null;
  onToggleEmail: (id: string) => void;
}) {
  const Icon = page.icon;
  const linkHref = page.testHref || page.href;

  return (
    <div className="relative">
      {/* Dot on the connector line */}
      <div className="absolute -left-[25px] top-5 w-3 h-3 rounded-full bg-white border-2 border-card-border z-10" />

      <div className="bg-white border border-card-border rounded-lg p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-start gap-4">
          {/* Step number */}
          <span className="text-xs text-foreground-muted w-5 pt-1 flex-shrink-0 text-right">
            {index}.
          </span>

          {/* Icon */}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${page.color}`}
          >
            <Icon className="w-4 h-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-navy text-sm">{page.title}</h3>
              {page.requiresAuth && (
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                  Auth Required
                </span>
              )}
            </div>
            <p className="text-xs text-foreground-muted mt-0.5">{page.description}</p>
            <p className="text-xs text-teal mt-1 font-mono">{page.href}</p>

            {/* Email chips */}
            {page.emails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {page.emails.map((emailId) => (
                  <EmailChip
                    key={emailId}
                    emailId={emailId}
                    expanded={expandedEmail === emailId}
                    onToggle={() => onToggleEmail(emailId)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {page.testHref && (
              <Link
                href={page.testHref}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-teal text-white text-xs rounded hover:opacity-90 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Test
              </Link>
            )}
            <Link
              href={linkHref}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-navy text-navy text-xs rounded hover:bg-navy hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View
            </Link>
          </div>
        </div>

        {/* Expanded email preview (inline below the page card content) */}
        {page.emails.map(
          (emailId) =>
            expandedEmail === emailId && (
              <EmailPreview key={emailId} emailId={emailId} />
            )
        )}
      </div>
    </div>
  );
}

function FollowUpEmailCard({
  emailId,
  index,
  expandedEmail,
  onToggleEmail,
}: {
  emailId: string;
  index: number;
  expandedEmail: string | null;
  onToggleEmail: (id: string) => void;
}) {
  const template = emailTemplates[emailId];
  if (!template) return null;

  const isExpanded = expandedEmail === emailId;

  return (
    <div className="relative">
      {/* Dot on the connector line */}
      <div className="absolute -left-[25px] top-5 w-3 h-3 rounded-full bg-white border-2 border-card-border z-10" />

      <div className="bg-white border border-card-border rounded-lg p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-start gap-4">
          {/* Step number */}
          <span className="text-xs text-foreground-muted w-5 pt-1 flex-shrink-0 text-right">
            {index}.
          </span>

          {/* Clock icon */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-navy/10">
            <Clock className="w-4 h-4 text-navy" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-navy text-sm">{template.name}</h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              <span className="font-medium">Subject:</span> {template.subject}
            </p>
            <p className="text-xs text-foreground-muted mt-0.5">
              <span className="font-medium">Trigger:</span> {template.trigger}
            </p>

            {/* Variables */}
            {template.variables.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {template.variables.map((v) => (
                  <code
                    key={v}
                    className="text-xs bg-gold/10 text-gold px-1.5 py-0.5 rounded font-mono"
                  >
                    {`{{${v}}}`}
                  </code>
                ))}
              </div>
            )}

            {/* Email chip to toggle preview */}
            <div className="mt-2">
              <EmailChip
                emailId={emailId}
                expanded={isExpanded}
                onToggle={() => onToggleEmail(emailId)}
              />
            </div>
          </div>
        </div>

        {/* Expanded email preview */}
        {isExpanded && <EmailPreview emailId={emailId} />}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FunnelsPage() {
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  function toggleEmail(id: string) {
    setExpandedEmail((prev) => (prev === id ? null : id));
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link
            href="/test"
            className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex-1">
            <p className="text-gold font-medium text-sm tracking-wide">DNA HUB</p>
            <p className="font-semibold">Funnels &amp; User-Facing Pages</p>
          </div>
          <Link
            href="/test/emails"
            className="flex items-center gap-2 text-sm px-3 py-1.5 bg-teal text-white rounded hover:opacity-90 transition-colors"
          >
            <Mail className="w-4 h-4" />
            All Emails
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Intro card */}
        <div className="card mb-8">
          <h1 className="text-xl font-semibold text-navy mb-1">
            Funnels &amp; User-Facing Pages
          </h1>
          <p className="text-foreground-muted text-sm">
            Every user-facing page organized by funnel, with inline email previews. Click any
            teal email chip to expand the email template preview directly below the page card.
            Follow-up and demo sections show cron-triggered emails without parent pages.
          </p>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full">
                Auth Required
              </span>{' '}
              needs login
            </span>
            <span className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-teal text-white rounded">Test</span> mock-data
              version
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-teal" />
              click to expand email preview
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-navy" />
              automated / cron-triggered
            </span>
            <span className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-foreground-muted" />
              page in funnel
            </span>
          </div>
        </div>

        {/* Funnel sections */}
        {funnelSections.map((section) => (
          <div key={section.id} className="mb-12">
            {/* Section header */}
            <div
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border mb-4 ${section.color} ${section.borderColor}`}
            >
              <span className="font-bold text-sm w-6 h-6 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0">
                {section.number}
              </span>
              <span className="font-semibold text-sm">{section.label}</span>
            </div>

            {/* Pages with connector line */}
            {section.pages && section.pages.length > 0 && (
              <div className="relative pl-6">
                {/* Vertical connector line */}
                <div className="absolute left-[11px] top-4 bottom-4 w-px bg-card-border" />

                <div className="space-y-2">
                  {section.pages.map((page, i) => (
                    <PageCard
                      key={page.href + i}
                      page={page}
                      index={i + 1}
                      expandedEmail={expandedEmail}
                      onToggleEmail={toggleEmail}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up email-only sections */}
            {section.followUpEmails && section.followUpEmails.length > 0 && (
              <div className="relative pl-6">
                {/* Vertical connector line */}
                <div className="absolute left-[11px] top-4 bottom-4 w-px bg-card-border" />

                <div className="space-y-2">
                  {section.followUpEmails.map((emailId, i) => (
                    <FollowUpEmailCard
                      key={emailId}
                      emailId={emailId}
                      index={i + 1}
                      expandedEmail={expandedEmail}
                      onToggleEmail={toggleEmail}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
