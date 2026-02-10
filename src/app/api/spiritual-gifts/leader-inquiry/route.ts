import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, churchName, churchSize, message } = body;

    // Validate required fields
    if (!name || !email || !churchName || !churchSize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store in Supabase (create a spiritual_gifts_leader_inquiries table)
    const { data, error } = await supabase
      .from('spiritual_gifts_leader_inquiries')
      .insert({
        name,
        email,
        church_name: churchName,
        church_size: churchSize,
        message: message || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save inquiry' },
        { status: 500 }
      );
    }

    // Send follow-up email via Resend
    if (resend) {
      try {
        await resend.emails.send({
          from: 'DNA Discipleship <noreply@dnadiscipleship.com>',
          to: email,
          subject: 'Your Ministry Gifts Test Team Request',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #2563eb;">Thanks for Your Interest, ${name}!</h1>

              <p>We received your request for team access to the Ministry Gifts Test for <strong>${churchName}</strong>.</p>

              <p>Our team will review your request and send you access details within 24 hours.</p>

              <h2 style="color: #1e40af; margin-top: 30px;">What's Next?</h2>
              <ol>
                <li>We'll create a custom team dashboard for ${churchName}</li>
                <li>You'll receive unique assessment links for your team members</li>
                <li>Results will automatically populate in your dashboard</li>
                <li>You can download individual PDFs and team reports</li>
              </ol>

              <!-- CTA Box -->
              <div style="background: #EFF6FF; border: 2px solid #3B82F6; border-radius: 12px; padding: 24px; margin: 30px 0;">
                <h3 style="color: #1e293b; margin-top: 0; font-size: 18px;">Want to See What Your Team Will Experience?</h3>
                <p style="color: #475569; margin-bottom: 20px;">
                  Take the assessment yourself (15 minutes) and see the quality firsthand. You'll understand exactly what you're asking your team to do.
                </p>
                <a href="https://dailydna.app/gifts" style="display: inline-block; background: #2563EB; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Try It Now →
                </a>
              </div>

              <h2 style="color: #1e40af; margin-top: 30px;">In the Meantime</h2>
              <p>Want to learn more about DNA Discipleship?</p>
              <ul>
                <li><a href="https://dnadiscipleship.com" style="color: #2563eb;">Visit our website</a></li>
                <li><a href="https://dailydna.app" style="color: #2563eb;">Try the Daily DNA app</a></li>
              </ul>

              <p style="margin-top: 40px; color: #6b7280; font-size: 14px;">
                Questions? Reply to this email or contact us at support@dnadiscipleship.com
              </p>

              <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
                DNA Discipleship<br>
                Building disciple-makers, one leader at a time
              </p>
            </div>
          `,
        });

        // Send internal notification
        await resend.emails.send({
          from: 'DNA Discipleship <noreply@dnadiscipleship.com>',
          to: 'thearkidentity@gmail.com', // Replace with your team email
          subject: `New Ministry Gifts Test Team Request: ${churchName}`,
          html: `
            <div style="font-family: sans-serif;">
              <h2>New Team Assessment Request</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Church:</strong> ${churchName}</p>
              <p><strong>Size:</strong> ${churchSize}</p>
              ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Resend email error:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
