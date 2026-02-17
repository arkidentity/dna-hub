'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, ChevronDown, ChevronRight, Send, Users, Bell, Key, FileText, CheckCircle, Rocket, BookOpen, Compass, GraduationCap, UserPlus, Shield } from 'lucide-react';

type EmailCategory = 'user' | 'admin' | 'dna';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  trigger: string;
  recipient: EmailCategory;
  variables: string[];
  html: string;
}

const emailTemplates: EmailTemplate[] = [
  // User-facing emails (to church leaders)
  {
    id: 'magic-link',
    name: 'Magic Link Login',
    subject: 'Your DNA Dashboard Login Link',
    trigger: 'User requests login from /login page',
    recipient: 'user',
    variables: ['name', 'magicLink'],
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2332;">Hi {{name}},</h2>
        <p>Click the button below to access your DNA Church Dashboard:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{magicLink}}"
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
          <a href="{{magicLink}}" style="color: #2D6A6A;">{{magicLink}}</a>
        </p>
        <p style="color: #5A6577; font-size: 14px; margin-top: 30px;">
          — DNA Church Hub
        </p>
      </div>
    `,
  },
  {
    id: 'dna-manual',
    name: 'DNA Manual Delivery',
    subject: 'Your DNA Manual is here',
    trigger: 'User signs up on landing page (/)',
    recipient: 'user',
    variables: ['firstName', 'manualUrl', 'assessmentUrl'],
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2332;">Hey {{firstName}},</h2>
        <p>Thanks for your interest in DNA Discipleship!</p>
        <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 16px 0; font-weight: 600; color: #1A2332;">Here's your resource:</p>
          <a href="{{manualUrl}}"
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
          <a href="{{assessmentUrl}}"
             style="background: #2D6A6A; color: white; padding: 14px 28px;
                    border-radius: 8px; text-decoration: none; font-weight: 500;
                    display: inline-block;">
            See If DNA Is Right for Your Church
          </a>
        </div>
        <p>We'll give you personalized next steps based on your answers.</p>
        <p style="margin-top: 32px;">Travis<br>
        <span style="color: #5A6577;">DNA Discipleship</span></p>
        <p style="color: #5A6577; font-size: 14px; margin-top: 24px;">
          P.S. Have questions? Just hit reply. I read every email.
        </p>
      </div>
    `,
  },
  {
    id: '3-steps-ready',
    name: '3 Steps Guide - Ready',
    subject: 'Your 3 Steps to Becoming a Community That Multiplies',
    trigger: 'Assessment completed with "ready" readiness level',
    recipient: 'user',
    variables: ['firstName', 'threeStepsUrl', 'launchGuideUrl', 'discoveryCallUrl'],
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2332;">Hey {{firstName}},</h2>
        <p>Thanks for completing the DNA Church Assessment!</p>
        <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <h3 style="color: #1A2332; margin: 0 0 16px 0;">3 Steps to Becoming a Community That Multiplies</h3>
          <p style="margin: 0 0 20px 0; color: #5A6577;">Your personalized guide based on where your church is right now.</p>
          <a href="{{threeStepsUrl}}"
             style="background: #D4A853; color: white; padding: 16px 32px;
                    border-radius: 8px; text-decoration: none; font-weight: 500;
                    display: inline-block;">
            Download Your 3 Steps Guide (PDF)
          </a>
        </div>
        <div style="background: #1A2332; color: white; padding: 24px; border-radius: 8px; margin: 24px 0;">
          <h3 style="color: #D4A853; margin: 0 0 12px 0;">You're Ready to Launch!</h3>
          <p style="margin: 0; color: #E8E8E8;">Your church shows strong alignment for DNA implementation. You have the leadership buy-in and foundation in place to move quickly.</p>
        </div>
        <h3 style="color: #1A2332;">Suggested Next Steps</h3>
        <div style="background: #F8F9FA; padding: 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2D6A6A;">
          <h4 style="color: #1A2332; margin: 0 0 8px 0;">Get Your Launch Guide</h4>
          <p style="color: #5A6577; margin: 0 0 12px 0; font-size: 14px;">Everything you need to prepare for a successful DNA launch at your church.</p>
          <a href="{{launchGuideUrl}}" style="color: #2D6A6A; text-decoration: none; font-weight: 500;">
            Download Launch Guide →
          </a>
        </div>
        <div style="background: #1A2332; padding: 20px; border-radius: 8px; margin: 16px 0;">
          <h4 style="color: white; margin: 0 0 8px 0;">Book Your Discovery Call</h4>
          <p style="color: #E8E8E8; margin: 0 0 12px 0; font-size: 14px;">A 15-minute conversation to see if DNA is the right fit for your church.</p>
          <p style="color: #D4A853; margin: 0 0 16px 0; font-size: 14px; font-weight: 500;">Book your Discovery Call now and receive the 90-Day Implementation Toolkit</p>
          <a href="{{discoveryCallUrl}}"
             style="background: #D4A853; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: 500;
                    display: inline-block;">
            Book Discovery Call (15 min)
          </a>
        </div>
        <p style="margin-top: 32px;">Travis<br>
        <span style="color: #5A6577;">DNA Discipleship</span></p>
      </div>
    `,
  },
  {
    id: '3-steps-building',
    name: '3 Steps Guide - Building',
    subject: 'Your 3 Steps to Becoming a Community That Multiplies',
    trigger: 'Assessment completed with "building" readiness level',
    recipient: 'user',
    variables: ['firstName', 'threeStepsUrl', 'dnaManualUrl', 'discoveryCallUrl'],
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2332;">Hey {{firstName}},</h2>
        <p>Thanks for completing the DNA Church Assessment!</p>
        <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <h3 style="color: #1A2332; margin: 0 0 16px 0;">3 Steps to Becoming a Community That Multiplies</h3>
          <a href="{{threeStepsUrl}}"
             style="background: #D4A853; color: white; padding: 16px 32px;
                    border-radius: 8px; text-decoration: none; font-weight: 500;
                    display: inline-block;">
            Download Your 3 Steps Guide (PDF)
          </a>
        </div>
        <div style="background: #1A2332; color: white; padding: 24px; border-radius: 8px; margin: 24px 0;">
          <h3 style="color: #D4A853; margin: 0 0 12px 0;">You're Building the Foundation</h3>
          <p style="margin: 0; color: #E8E8E8;">You're on the right track. There are a few things to align before launching DNA, and we can help you get there.</p>
        </div>
        <div style="background: #F8F9FA; padding: 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2D6A6A;">
          <h4 style="color: #1A2332; margin: 0 0 8px 0;">Read the DNA Manual</h4>
          <p style="color: #5A6577; margin: 0 0 12px 0; font-size: 14px;">Understand the theology and heart behind DNA. Share it with your leadership team.</p>
          <a href="{{dnaManualUrl}}" style="color: #2D6A6A; text-decoration: none; font-weight: 500;">
            Download DNA Manual →
          </a>
        </div>
        <div style="background: #1A2332; padding: 20px; border-radius: 8px; margin: 16px 0;">
          <h4 style="color: white; margin: 0 0 8px 0;">Book Your Discovery Call</h4>
          <p style="color: #D4A853; margin: 0 0 16px 0; font-size: 14px; font-weight: 500;">Book your Discovery Call now and receive the Launch Guide</p>
          <a href="{{discoveryCallUrl}}"
             style="background: #D4A853; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: 500;
                    display: inline-block;">
            Book Discovery Call (15 min)
          </a>
        </div>
        <p style="margin-top: 32px;">Travis<br>
        <span style="color: #5A6577;">DNA Discipleship</span></p>
      </div>
    `,
  },
  {
    id: '3-steps-exploring',
    name: '3 Steps Guide - Exploring',
    subject: 'Your 3 Steps to Becoming a Community That Multiplies',
    trigger: 'Assessment completed with "exploring" readiness level',
    recipient: 'user',
    variables: ['firstName', 'threeStepsUrl', 'dnaManualUrl', 'discoveryCallUrl'],
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2332;">Hey {{firstName}},</h2>
        <p>Thanks for completing the DNA Church Assessment!</p>
        <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <h3 style="color: #1A2332; margin: 0 0 16px 0;">3 Steps to Becoming a Community That Multiplies</h3>
          <a href="{{threeStepsUrl}}"
             style="background: #D4A853; color: white; padding: 16px 32px;
                    border-radius: 8px; text-decoration: none; font-weight: 500;
                    display: inline-block;">
            Download Your 3 Steps Guide (PDF)
          </a>
        </div>
        <div style="background: #1A2332; color: white; padding: 24px; border-radius: 8px; margin: 24px 0;">
          <h3 style="color: #D4A853; margin: 0 0 12px 0;">You're in Discovery Mode</h3>
          <p style="margin: 0; color: #E8E8E8;">DNA might be a good fit down the road. Start by understanding the vision and sharing it with your team.</p>
        </div>
        <div style="background: #F8F9FA; padding: 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2D6A6A;">
          <h4 style="color: #1A2332; margin: 0 0 8px 0;">Read the DNA Manual</h4>
          <p style="color: #5A6577; margin: 0 0 12px 0; font-size: 14px;">Start with the 'why' behind multiplication discipleship before the 'how'.</p>
          <a href="{{dnaManualUrl}}" style="color: #2D6A6A; text-decoration: none; font-weight: 500;">
            Download DNA Manual →
          </a>
        </div>
        <div style="background: #1A2332; padding: 20px; border-radius: 8px; margin: 16px 0;">
          <h4 style="color: white; margin: 0 0 8px 0;">Book Your Discovery Call</h4>
          <p style="color: #D4A853; margin: 0 0 16px 0; font-size: 14px; font-weight: 500;">Let's discuss your path forward together</p>
          <a href="{{discoveryCallUrl}}"
             style="background: #D4A853; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: 500;
                    display: inline-block;">
            Book Discovery Call (15 min)
          </a>
        </div>
        <p style="margin-top: 32px;">Travis<br>
        <span style="color: #5A6577;">DNA Discipleship</span></p>
      </div>
    `,
  },
  {
    id: 'proposal-ready',
    name: 'Proposal Ready',
    subject: 'Your DNA Proposal is Ready - {{churchName}}',
    trigger: 'Admin moves church to "proposal_sent" status',
    recipient: 'user',
    variables: ['firstName', 'churchName', 'portalUrl', 'proposalCallUrl'],
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2332;">Hey {{firstName}},</h2>
        <p>Great news! Following our discovery call, I've put together a customized DNA implementation proposal for {{churchName}}.</p>
        <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0;">
          <h3 style="color: #1A2332; margin: 0 0 12px 0;">Your Proposal is Ready</h3>
          <p style="margin: 0 0 16px 0;">View your proposal and all your discovery notes in your portal:</p>
          <a href="{{portalUrl}}"
             style="background: #D4A853; color: white; padding: 14px 28px;
                    border-radius: 8px; text-decoration: none; font-weight: 500;
                    display: inline-block;">
            View Your Portal
          </a>
        </div>
        <h3 style="color: #1A2332;">Next Step: Proposal Review Call</h3>
        <p>Book a 30-minute call to walk through the proposal together. I'll answer any questions and we can discuss which tier makes the most sense for {{churchName}}.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="{{proposalCallUrl}}"
             style="background: #2D6A6A; color: white; padding: 14px 28px;
                    border-radius: 8px; text-decoration: none; font-weight: 500;
                    display: inline-block;">
            Book Proposal Review Call (30 min)
          </a>
        </div>
        <p style="margin-top: 32px;">Travis<br>
        <span style="color: #5A6577;">DNA Discipleship</span></p>
      </div>
    `,
  },
  {
    id: 'agreement-confirmed',
    name: 'Agreement Confirmed',
    subject: 'Welcome to DNA! - {{churchName}}',
    trigger: 'Admin moves church to "awaiting_strategy" status',
    recipient: 'user',
    variables: ['firstName', 'churchName', 'tierName', 'portalUrl', 'strategyCallUrl'],
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2332;">Hey {{firstName}}!</h2>
        <div style="background: #4A9E7F; color: white; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <h3 style="margin: 0 0 8px 0;">Welcome to DNA!</h3>
          <p style="margin: 0; font-size: 18px;">{{churchName}} is now part of the DNA family</p>
        </div>
        <p>I'm excited to partner with you on this journey. You've chosen the <strong>{{tierName}}</strong> tier, and I can't wait to see how God uses DNA at {{churchName}}.</p>
        <h3 style="color: #1A2332;">Your Agreement</h3>
        <p>Your signed agreement and all documents are available in your portal:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="{{portalUrl}}"
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
          <a href="{{strategyCallUrl}}"
             style="background: #2D6A6A; color: white; padding: 14px 28px;
                    border-radius: 8px; text-decoration: none; font-weight: 500;
                    display: inline-block;">
            Book Strategy Call (60 min)
          </a>
        </div>
        <p style="margin-top: 32px;">Travis<br>
        <span style="color: #5A6577;">DNA Discipleship</span></p>
      </div>
    `,
  },
  {
    id: 'dashboard-access',
    name: 'Dashboard Access',
    subject: 'Your DNA Dashboard is Live! - {{churchName}}',
    trigger: 'Admin moves church to "active" status',
    recipient: 'user',
    variables: ['firstName', 'churchName', 'dashboardUrl'],
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2332;">Hey {{firstName}}!</h2>
        <div style="background: #1A2332; color: white; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <h3 style="color: #D4A853; margin: 0 0 8px 0;">Your Dashboard is Live!</h3>
          <p style="margin: 0;">Full access to {{churchName}}'s DNA implementation hub</p>
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
          <a href="{{dashboardUrl}}"
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
    `,
  },
  // DNA Groups / Training emails
  {
    id: 'dna-leader-magic-link',
    name: 'DNA Leader Magic Link',
    subject: 'Your DNA Hub Login Link',
    trigger: 'DNA leader requests login — sends branded version of magic link',
    recipient: 'dna',
    variables: ['name', 'magicLink'],
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2332;">Hi {{name}},</h2>
        <p>Click the button below to access your DNA Group dashboard:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{magicLink}}"
             style="background: #2D6A6A; color: white; padding: 16px 32px;
                    border-radius: 8px; text-decoration: none; font-weight: 500;
                    display: inline-block;">
            Access DNA Hub
          </a>
        </div>
        <p style="color: #5A6577; font-size: 14px;">
          This link expires in 7 days. If you didn't request this, you can safely ignore this email.
        </p>
        <p style="color: #5A6577; font-size: 14px; margin-top: 30px;">
          — DNA Church Hub
        </p>
      </div>
    `,
  },
  {
    id: 'training-welcome',
    name: 'Training Welcome',
    subject: 'Welcome to DNA Training',
    trigger: 'User is provisioned as a training_participant and gets first access',
    recipient: 'dna',
    variables: ['name', 'loginUrl'],
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2332;">Welcome to DNA Training, {{name}}!</h2>
        <div style="background: #1A2332; color: white; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <h3 style="color: #D4A853; margin: 0 0 8px 0;">Your Training Has Begun</h3>
          <p style="margin: 0; color: #E8E8E8;">You now have access to the DNA Training platform</p>
        </div>
        <p>Your training journey starts with the Flow Assessment — a tool to help you identify what's slowing your discipleship down and build a plan to move forward.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="{{loginUrl}}"
             style="background: #D4A853; color: white; padding: 16px 32px;
                    border-radius: 8px; text-decoration: none; font-weight: 500;
                    display: inline-block;">
            Start Training
          </a>
        </div>
        <p style="margin-top: 32px;">Travis<br>
        <span style="color: #5A6577;">DNA Discipleship</span></p>
      </div>
    `,
  },
  {
    id: 'co-leader-invitation',
    name: 'Co-Leader Invitation',
    subject: 'You\'ve been invited to co-lead a DNA group',
    trigger: 'DNA leader invites another leader to co-lead their group',
    recipient: 'dna',
    variables: ['inviteeName', 'inviterName', 'groupName', 'inviteUrl'],
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2332;">Hi {{inviteeName}},</h2>
        <p><strong>{{inviterName}}</strong> has invited you to co-lead their DNA group: <strong>{{groupName}}</strong>.</p>
        <div style="background: #F4E7D7; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 16px 0; color: #1A2332;">As a co-leader, you'll have full access to view and support the disciples in this group.</p>
          <a href="{{inviteUrl}}"
             style="background: #2D6A6A; color: white; padding: 14px 28px;
                    border-radius: 8px; text-decoration: none; font-weight: 500;
                    display: inline-block;">
            Accept Co-Leader Invitation
          </a>
        </div>
        <p style="color: #5A6577; font-size: 14px;">This invitation will expire. If you have questions, reply to this email.</p>
        <p style="margin-top: 32px;">— DNA Church Hub</p>
      </div>
    `,
  },
  {
    id: 'dna-leader-direct-invite',
    name: 'DNA Leader Direct Invite',
    subject: 'You\'ve been invited to lead a DNA group at {{churchName}}',
    trigger: 'Church leader directly invites someone to become a DNA group leader',
    recipient: 'dna',
    variables: ['leaderName', 'churchName', 'inviteUrl'],
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2332;">Hi {{leaderName}},</h2>
        <p>You've been personally invited to lead a DNA discipleship group at <strong>{{churchName}}</strong>.</p>
        <div style="background: #1A2332; color: white; padding: 24px; border-radius: 8px; margin: 24px 0;">
          <h3 style="color: #D4A853; margin: 0 0 12px 0;">What is DNA?</h3>
          <p style="margin: 0; color: #E8E8E8; font-size: 14px;">DNA (Discipleship, Nurture, Accountability) groups are small, multiplying communities of 2-3 people who help each other grow in faith and become disciple-makers themselves.</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="{{inviteUrl}}"
             style="background: #D4A853; color: white; padding: 16px 32px;
                    border-radius: 8px; text-decoration: none; font-weight: 500;
                    display: inline-block;">
            Accept Invitation & Get Started
          </a>
        </div>
        <p style="margin-top: 32px;">— DNA Church Hub</p>
      </div>
    `,
  },
  // Admin notification emails
  {
    id: 'assessment-notification',
    name: 'New Assessment Notification',
    subject: 'New DNA Assessment: {{churchName}}',
    trigger: 'New assessment submitted via /assessment',
    recipient: 'admin',
    variables: ['churchName', 'contactName', 'contactEmail'],
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2332;">New Church Assessment Submitted</h2>
        <div style="background: #F4E7D7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Church:</strong> {{churchName}}</p>
          <p style="margin: 0 0 10px 0;"><strong>Contact:</strong> {{contactName}}</p>
          <p style="margin: 0;"><strong>Email:</strong> {{contactEmail}}</p>
        </div>
        <p>Review their assessment and schedule a strategy call.</p>
        <p style="color: #5A6577; font-size: 14px; margin-top: 30px;">
          — DNA Church Hub
        </p>
      </div>
    `,
  },
  {
    id: 'milestone-notification',
    name: 'Key Milestone Completed',
    subject: '🎉 {{churchName}} - Milestone Completed',
    trigger: 'Church leader completes a key milestone',
    recipient: 'admin',
    variables: ['churchName', 'milestoneName', 'phaseName', 'completedBy'],
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2332;">Key Milestone Completed!</h2>
        <div style="background: #F4E7D7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Church:</strong> {{churchName}}</p>
          <p style="margin: 0 0 10px 0;"><strong>Phase:</strong> {{phaseName}}</p>
          <p style="margin: 0 0 10px 0;"><strong>Milestone:</strong> {{milestoneName}}</p>
          <p style="margin: 0;"><strong>Completed by:</strong> {{completedBy}}</p>
        </div>
        <p>Consider reaching out to celebrate and encourage them!</p>
        <p style="color: #5A6577; font-size: 14px; margin-top: 30px;">
          — DNA Church Hub
        </p>
      </div>
    `,
  },
  {
    id: 'phase-completion-notification',
    name: 'Phase Completed',
    subject: '🏆 {{churchName}} - Phase {{phaseNumber}} Complete!',
    trigger: 'Church completes all milestones in a phase',
    recipient: 'admin',
    variables: ['churchName', 'phaseNumber', 'phaseName'],
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1A2332;">Phase {{phaseNumber}} Completed!</h2>
        <div style="background: #4A9E7F; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-size: 18px;"><strong>{{churchName}}</strong></p>
          <p style="margin: 0;">Has completed <strong>{{phaseName}}</strong></p>
        </div>
        <p>They've unlocked Phase {{nextPhase}} and are ready to continue their DNA journey.</p>
        <p>This is a great time to check in and celebrate their progress!</p>
        <p style="color: #5A6577; font-size: 14px; margin-top: 30px;">
          — DNA Church Hub
        </p>
      </div>
    `,
  },
];

export default function TestEmailsPage() {
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'user' | 'admin' | 'dna'>('user');

  const userEmails = emailTemplates.filter(e => e.recipient === 'user');
  const adminEmails = emailTemplates.filter(e => e.recipient === 'admin');
  const dnaEmails = emailTemplates.filter(e => e.recipient === 'dna');
  const displayEmails = activeTab === 'user' ? userEmails : activeTab === 'dna' ? dnaEmails : adminEmails;

  // Auto-expand and scroll to email when arriving via anchor link from /test
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const template = emailTemplates.find(e => e.id === hash);
    if (!template) return;
    // Switch to the right tab
    setActiveTab(template.recipient);
    // Expand the email
    setExpandedEmail(hash);
    // Scroll after render
    setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const toggleEmail = (id: string) => {
    setExpandedEmail(expandedEmail === id ? null : id);
  };

  const getIcon = (id: string) => {
    const icons: Record<string, typeof Mail> = {
      'magic-link': Key,
      'dna-manual': BookOpen,
      '3-steps-ready': Rocket,
      '3-steps-building': BookOpen,
      '3-steps-exploring': Compass,
      'proposal-ready': FileText,
      'agreement-confirmed': CheckCircle,
      'dashboard-access': Send,
      'assessment-notification': Bell,
      'milestone-notification': CheckCircle,
      'phase-completion-notification': CheckCircle,
      'dna-leader-magic-link': Key,
      'training-welcome': GraduationCap,
      'co-leader-invitation': UserPlus,
      'dna-leader-direct-invite': Shield,
    };
    return icons[id] || Mail;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/test" className="text-gray-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-gold font-medium text-sm tracking-wide">DNA HUB</p>
            <p className="font-semibold">Email Templates</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="card mb-8">
          <h1 className="text-xl font-semibold text-navy mb-2">Email Flow & Copy</h1>
          <p className="text-foreground-muted">
            All automated emails sent during the sales funnel and implementation process.
            Click any email to preview the full HTML template.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('user')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'user'
                ? 'bg-gold text-white'
                : 'bg-background-secondary text-navy hover:bg-gold/10'
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              To Church Leaders ({userEmails.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('dna')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'dna'
                ? 'bg-teal text-white'
                : 'bg-background-secondary text-navy hover:bg-teal/10'
            }`}
          >
            <span className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              DNA Leaders &amp; Training ({dnaEmails.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'admin'
                ? 'bg-navy text-white'
                : 'bg-background-secondary text-navy hover:bg-navy/10'
            }`}
          >
            <span className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              To Admin ({adminEmails.length})
            </span>
          </button>
        </div>

        {/* Email List */}
        <div className="space-y-3">
          {displayEmails.map((email, index) => {
            const Icon = getIcon(email.id);
            const isExpanded = expandedEmail === email.id;

            return (
              <div key={email.id} id={email.id} className="card scroll-mt-6">
                <button
                  onClick={() => toggleEmail(email.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-foreground-muted w-5">{index + 1}.</span>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activeTab === 'user' ? 'bg-gold/10 text-gold' : activeTab === 'dna' ? 'bg-teal/10 text-teal' : 'bg-navy/10 text-navy'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-navy">{email.name}</h3>
                      </div>
                      <p className="text-sm text-foreground-muted font-mono mt-1">
                        Subject: {email.subject}
                      </p>
                      <p className="text-xs text-teal mt-1">
                        Trigger: {email.trigger}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-foreground-muted" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-foreground-muted" />
                      )}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-card-border">
                    <div className="mb-4">
                      <p className="text-xs text-foreground-muted mb-2">Variables:</p>
                      <div className="flex flex-wrap gap-1">
                        {email.variables.map(v => (
                          <code key={v} className="text-xs bg-background-secondary px-2 py-1 rounded">
                            {`{{${v}}}`}
                          </code>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white border border-card-border rounded-lg overflow-hidden">
                      <div className="bg-background-secondary px-4 py-2 border-b border-card-border">
                        <p className="text-xs text-foreground-muted">Email Preview</p>
                      </div>
                      <div
                        className="p-4"
                        dangerouslySetInnerHTML={{ __html: email.html }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Email Flow Diagram */}
        <div className="card mt-8">
          <h2 className="text-lg font-semibold text-navy mb-4">Email Flow Summary</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-navy mb-2">Landing Page Flow</h3>
              <div className="flex items-center gap-2 text-sm text-foreground-muted">
                <span className="bg-gold/10 text-gold px-2 py-1 rounded">Landing signup</span>
                <span>→</span>
                <span className="bg-teal/10 text-teal px-2 py-1 rounded">DNA Manual Email</span>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-navy mb-2">Assessment Flow</h3>
              <div className="flex items-center gap-2 text-sm text-foreground-muted flex-wrap">
                <span className="bg-gold/10 text-gold px-2 py-1 rounded">Assessment submit</span>
                <span>→</span>
                <span className="bg-teal/10 text-teal px-2 py-1 rounded">3 Steps Email (tiered)</span>
                <span>+</span>
                <span className="bg-navy/10 text-navy px-2 py-1 rounded">Admin Notification</span>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-navy mb-2">Sales Pipeline Flow</h3>
              <div className="flex items-center gap-2 text-sm text-foreground-muted flex-wrap">
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Proposal Sent</span>
                <span>→</span>
                <span className="bg-teal/10 text-teal px-2 py-1 rounded">Proposal Ready Email</span>
                <span>→</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Agreement Signed</span>
                <span>→</span>
                <span className="bg-teal/10 text-teal px-2 py-1 rounded">Welcome Email</span>
                <span>→</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Activated</span>
                <span>→</span>
                <span className="bg-teal/10 text-teal px-2 py-1 rounded">Dashboard Access Email</span>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-navy mb-2">DNA Leader / Training Flow</h3>
              <div className="flex items-center gap-2 text-sm text-foreground-muted flex-wrap">
                <span className="bg-teal/10 text-teal px-2 py-1 rounded">Church leader invites</span>
                <span>→</span>
                <span className="bg-teal/10 text-teal px-2 py-1 rounded">DNA Leader Direct Invite</span>
                <span>→</span>
                <span className="bg-teal/10 text-teal px-2 py-1 rounded">Training Welcome</span>
                <span className="mx-2">|</span>
                <span className="bg-teal/10 text-teal px-2 py-1 rounded">Login request</span>
                <span>→</span>
                <span className="bg-teal/10 text-teal px-2 py-1 rounded">DNA Leader Magic Link</span>
                <span className="mx-2">|</span>
                <span className="bg-teal/10 text-teal px-2 py-1 rounded">Co-leader invite</span>
                <span>→</span>
                <span className="bg-teal/10 text-teal px-2 py-1 rounded">Co-Leader Invitation</span>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-navy mb-2">Implementation Notifications (to Admin)</h3>
              <div className="flex items-center gap-2 text-sm text-foreground-muted flex-wrap">
                <span className="bg-success/10 text-success px-2 py-1 rounded">Key Milestone</span>
                <span>→</span>
                <span className="bg-navy/10 text-navy px-2 py-1 rounded">Milestone Notification</span>
                <span className="mx-2">|</span>
                <span className="bg-success/10 text-success px-2 py-1 rounded">Phase Complete</span>
                <span>→</span>
                <span className="bg-navy/10 text-navy px-2 py-1 rounded">Phase Notification</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
