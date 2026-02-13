import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/auth';
import { sendDNAManualEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, firstName } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const resolvedFirstName = firstName || 'Friend';

    const supabase = getSupabaseAdmin();

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('email_subscribers')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      // Still send the email even if already subscribed
      await sendDNAManualEmail(email, resolvedFirstName);
      return NextResponse.json({ success: true, message: 'Email resent' });
    }

    // Create new subscriber
    const { error: insertError } = await supabase
      .from('email_subscribers')
      .insert({
        email: email.toLowerCase(),
        first_name: resolvedFirstName,
        subscribed_at: new Date().toISOString(),
        manual_sent: true,
        assessment_started: false,
      });

    if (insertError) {
      console.error('[SUBSCRIBE] Insert error:', insertError);
      // Don't fail the request - still try to send the email
    }

    // Send the DNA Manual email
    const emailResult = await sendDNAManualEmail(email, resolvedFirstName);

    if (!emailResult.success) {
      console.error('[SUBSCRIBE] Email send failed:', emailResult.error);
      // Still return success if subscriber was created
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SUBSCRIBE] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
